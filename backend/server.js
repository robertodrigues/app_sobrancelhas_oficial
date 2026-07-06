const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const AnthropicSdk = require('@anthropic-ai/sdk');
const Anthropic = AnthropicSdk.default || AnthropicSdk;
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';

const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    realtime: {
      transport: ws,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const formatError = (message, status = 500) => ({ error: message, status });

const parseMercadoPagoSignature = (signatureHeader) => {
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return null;
  }

  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=').map((item) => item.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (!parts.ts || !parts.v1) {
    return null;
  }

  return {
    ts: parts.ts,
    v1: parts.v1,
  };
};

const verifyMercadoPagoWebhookSignature = ({ signatureHeader, requestId, paymentId, secret }) => {
  if (!secret || !signatureHeader || !requestId || !paymentId) {
    return false;
  }

  const parsed = parseMercadoPagoSignature(signatureHeader);
  if (!parsed) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${parsed.ts};`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const receivedBuffer = Buffer.from(parsed.v1, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeRole = (role) => {
  if (role === 'system' || role === 'assistant' || role === 'developer') {
    return role;
  }

  return 'user';
};

const toAnthropicContent = (content) => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.flatMap((item) => {
      if (!isObject(item)) {
        return [];
      }

      if (item.type === 'text' && typeof item.text === 'string') {
        return [{ type: 'text', text: item.text }];
      }

      if (
        item.type === 'image' &&
        isObject(item.source) &&
        item.source.type === 'base64' &&
        typeof item.source.data === 'string' &&
        typeof item.source.media_type === 'string'
      ) {
        return [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: item.source.media_type,
              data: item.source.data,
            },
          },
        ];
      }

      return [];
    });
  }

  if (content === null || content === undefined) {
    return '';
  }

  return String(content);
};

const convertMessagesForAnthropic = (messages) => {
  const systemParts = [];
  const convertedMessages = [];

  messages.forEach((message) => {
    const role = normalizeRole(message.role);
    const content = toAnthropicContent(message.content);

    if (role === 'system') {
      if (typeof content === 'string' && content.trim()) {
        systemParts.push(content.trim());
      }
      return;
    }

    convertedMessages.push({
      role: role === 'assistant' ? 'assistant' : 'user',
      content,
    });
  });

  return {
    messages: convertedMessages,
    system: systemParts.join('\n').trim(),
  };
};

const getCandidateText = (raw) => {
  if (isObject(raw) && isObject(raw.result)) {
    return JSON.stringify(raw.result);
  }

  if (isObject(raw) && Array.isArray(raw.content) && raw.content[0] && isObject(raw.content[0])) {
    const firstItem = raw.content[0];
    if (typeof firstItem.text === 'string') {
      return firstItem.text;
    }
  }

  if (isObject(raw) && typeof raw.text === 'string') {
    return raw.text;
  }

  if (typeof raw === 'string') {
    return raw;
  }

  return JSON.stringify(raw);
};

const requestUpstream = async (body, messages) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;

  console.log('=== VERIFICANDO PROVEDOR DE IA ===');
  console.log('ANTHROPIC_API_KEY existe?', !!process.env.ANTHROPIC_API_KEY);
  console.log('Modelo configurado:', model);

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada.');
  }

  const client = new Anthropic({
    apiKey,
  });

  const { messages: anthropicMessages, system } = convertMessagesForAnthropic(messages);

  console.log('>>> CHAMANDO ANTHROPIC AGORA <<<');

  const response = await client.messages.create({
    model,
    messages: anthropicMessages,
    max_tokens: body.max_tokens ?? 2000,
    temperature: body.temperature ?? 0,
    ...(system ? { system } : {}),
  });

  const text = Array.isArray(response.content)
    ? response.content
        .map((block) => (block && block.type === 'text' && typeof block.text === 'string' ? block.text : ''))
        .join('')
        .trim()
    : '';

  if (!text) {
    throw new Error('A Anthropic não retornou um texto válido.');
  }

  return {
    content: [{ type: 'text', text }],
  };
};

const allowedOrigins = [
  'https://app.elha.com.br',
  'https://elha.com.br',
  'https://www.elha.com.br',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));

// Rota de Health Check para o Keep-Alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/anthropic', async (req, res) => {
  try {
    const { messages, max_tokens, temperature } = req.body;

    console.log('=== ROTA ANTHROPIC CHAMADA NO backend/server.js ===');
    console.log('ANTHROPIC_API_KEY existe?', !!process.env.ANTHROPIC_API_KEY);
    console.log('Modelo:', process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL);

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages é obrigatório.' });
    }

    const response = await requestUpstream(
      {
        max_tokens,
        temperature,
      },
      messages,
    );

    // Mantém o formato que o frontend já sabe ler: content[0].text
    return res.json(response);
  } catch (error) {
    console.error('Erro na API da Anthropic:', error?.message);
    return res.status(500).json({ error: error?.message || 'Erro na API da Anthropic' });
  }
});

app.post('/api/document-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório para o upload.' });
    }

    const rawFolder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : 'capturas';
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'capturas';

    const file = req.file;
    const imageContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

    if (!file.mimetype || !imageContentTypes.has(file.mimetype)) {
      return res.status(400).json({ error: `Tipo de arquivo inválido: ${file.mimetype || 'desconhecido'}.` });
    }

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName || !publicUrl) {
      return res.status(500).json({ error: 'As variáveis do R2 não estão configuradas.' });
    }

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const extension =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : file.mimetype === 'image/gif'
            ? 'gif'
            : 'jpg';

    const key = `usuarios/${userId}/${folder}/${uuidv4()}.${extension}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return res.json({
      key,
      url: `${publicUrl.replace(/\/$/, '')}/${key}`,
    });
  } catch (error) {
    console.error('Erro no upload para R2:', error);
    return res.status(500).json({ error: 'Erro no upload para R2' });
  }
});

app.get('/api/credits/wallet', async (req, res) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor.' });
    }

    const { data: wallet, error: walletError } = await supabase
      .from('credit_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError) {
      throw walletError;
    }

    const { data: transactions, error: txError } = await supabase
      .from('credit_transactions')
      .select('id, type, amount_cents, payment_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (txError) {
      throw txError;
    }

    return res.json({
      balance_cents: wallet?.balance_cents || 0,
      recentTransactions: transactions || [],
    });
  } catch (error) {
    console.error('Erro ao buscar saldo de créditos:', error);
    return res.status(500).json({ error: 'Erro ao buscar saldo de créditos.' });
  }
});

app.post('/api/credits/create-pix', async (req, res) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const amount = Number(req.body?.amount ?? req.body?.amountCents);
    const transactionAmount = Number.isFinite(amount) && amount > 100 ? amount / 100 : amount;

    if (!userId || !Number.isFinite(transactionAmount)) {
      return res.status(400).json({ error: 'userId e amount são obrigatórios.' });
    }

    // Validação de valor mínimo de recarga de R$ 30,00
    if (transactionAmount < 30) {
      return res.status(400).json({ error: 'O valor mínimo para recarga é de R$ 30,00' });
    }

    if (!mercadoPagoAccessToken) {
      return res.status(500).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' });
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${userId}-${Date.now()}`,
      },
      body: JSON.stringify({
        payment_method_id: 'pix',
        transaction_amount: transactionAmount,
        description: 'Recarga de créditos - Elha App',
        external_reference: userId,
        payer: {
          email: 'pagador@elhaapp.com.br',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text || 'Não foi possível gerar o Pix.' });
    }

    const payment = await response.json();
    console.log('Mercado Pago payment response:', payment);

    const qrCode = payment?.point_of_interaction?.transaction_data?.qr_code || payment?.point_of_interaction?.transaction_data?.ticket_url || '';
    const qrCodeBase64 = payment?.point_of_interaction?.transaction_data?.qr_code_base64 || payment?.point_of_interaction?.transaction_data?.ticket_url || '';

    return res.json({
      paymentId: String(payment.id),
      qrCode,
      qrCodeBase64,
    });

  } catch (error) {
    console.error('Erro ao criar Pix do Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro ao criar Pix do Mercado Pago.' });
  }
});

app.post('/api/credits/webhook', async (req, res) => {
  try {
    const notificationType = req.body?.type;
    const paymentId = req.body?.data?.id ? String(req.body.data.id).trim() : '';
    const signatureHeader = req.get('x-signature');
    const requestId = req.get('x-request-id');
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    const signatureIsValid = verifyMercadoPagoWebhookSignature({
      signatureHeader,
      requestId,
      paymentId,
      secret: webhookSecret,
    });

    if (!signatureIsValid) {
      return res.status(200).json({ received: true });
    }

    if (notificationType !== 'payment' || !paymentId) {
      return res.status(200).json({ received: true });
    }

    if (!mercadoPagoAccessToken) {
      console.error('Webhook do Mercado Pago: MERCADO_PAGO_ACCESS_TOKEN não configurado.');
      return res.status(200).json({ received: true });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      const text = await paymentResponse.text();
      console.error('Webhook do Mercado Pago: falha ao consultar pagamento.', text);
      return res.status(200).json({ received: true });
    }

    const payment = await paymentResponse.json();

    if (payment?.status !== 'approved') {
      return res.status(200).json({ received: true });
    }

    const userId = typeof payment?.external_reference === 'string' ? payment.external_reference.trim() : '';
    if (!userId) {
      console.error('Webhook do Mercado Pago: external_reference ausente.');
      return res.status(200).json({ received: true });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Webhook do Mercado Pago: configuração do Supabase ausente.');
      return res.status(200).json({ received: true });
    }

    const { data: alreadyProcessed, error: alreadyProcessedError } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('payment_id', paymentId)
      .eq('status', 'approved')
      .maybeSingle();

    if (alreadyProcessedError) {
      throw alreadyProcessedError;
    }

    if (alreadyProcessed) {
      return res.status(200).json({ received: true });
    }

    const amountCents = Math.round(Number(payment?.transaction_amount || 0) * 100);

    const { data: wallet, error: walletError } = await supabase
      .from('credit_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError) {
      throw walletError;
    }

    const currentBalance = wallet?.balance_cents || 0;
    const nextBalance = currentBalance + amountCents;

    const { error: walletUpsertError } = await supabase
      .from('credit_wallets')
      .upsert(
        { user_id: userId, balance_cents: nextBalance, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (walletUpsertError) {
      throw walletUpsertError;
    }

    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'recharge',
      amount_cents: amountCents,
      payment_id: paymentId,
      status: 'approved',
      metadata: {
        marketplace: 'mercado_pago',
        webhook: true,
      },
    });

    if (transactionError) {
      throw transactionError;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return res.status(200).json({ received: true });
  }
});

app.post('/api/credits/confirm', async (req, res) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const paymentId = typeof req.body?.paymentId === 'string' ? req.body.paymentId.trim() : '';

    if (!userId || !paymentId) {
      return res.status(400).json({ error: 'userId e paymentId são obrigatórios.' });
    }

    if (!mercadoPagoAccessToken) {
      return res.status(500).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      const text = await paymentResponse.text();
      return res.status(paymentResponse.status).json({ error: text || 'Não foi possível consultar o pagamento.' });
    }

    const payment = await paymentResponse.json();
    const status = payment?.status || 'pending';

    if (status !== 'approved') {
      return res.json({ success: false, status });
    }

    const amount = Number(payment?.transaction_amount || 0);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor.' });
    }

    // Verificação se esse paymentId já existe em credit_transactions com status "approved"
    const { data: alreadyProcessed, error: checkError } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('payment_id', paymentId)
      .eq('status', 'approved')
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (alreadyProcessed) {
      return res.json({ success: true, alreadyProcessed: true });
    }

    const { data: wallet, error: walletFetchError } = await supabase
      .from('credit_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletFetchError) {
      throw walletFetchError;
    }

    const currentBalance = wallet?.balance_cents || 0;
    const rechargeAmount = Math.round(amount * 100);
    const newBalance = currentBalance + rechargeAmount;

    const { error: walletError } = await supabase
      .from('credit_wallets')
      .upsert(
        { user_id: userId, balance_cents: newBalance, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (walletError) {
      throw walletError;
    }

    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'recharge',
      amount_cents: rechargeAmount,
      payment_id: String(paymentId),
      status: 'approved',
      metadata: {
        marketplace: 'mercado_pago',
      },
    });

    if (transactionError) {
      throw transactionError;
    }

    return res.json({ success: true, newBalance });
  } catch (error) {
    console.error('Erro ao confirmar Pix do Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro ao confirmar Pix do Mercado Pago.' });
  }
});

app.get('/api/credits/payment-status', async (req, res) => {

  try {
    const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId.trim() : '';
    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId é obrigatório.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor.' });
    }

    const { data: tx, error: txError } = await supabase
      .from('credit_transactions')
      .select('id, user_id, amount_cents, status, metadata, payment_id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (txError) {
      throw txError;
    }

    if (!mercadoPagoAccessToken) {
      return res.status(500).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      const text = await paymentResponse.text();
      return res.status(paymentResponse.status).json({ error: text || 'Não foi possível consultar o pagamento.' });
    }

    const payment = await paymentResponse.json();
    const paymentStatus = payment?.status || 'pending';

    if (tx && paymentStatus === 'approved' && tx.status !== 'approved') {
      const { data: wallet } = await supabase
        .from('credit_wallets')
        .select('balance_cents')
        .eq('user_id', tx.user_id)
        .maybeSingle();

      const currentBalance = wallet?.balance_cents || 0;
      const nextBalance = currentBalance + tx.amount_cents;

      const { error: walletError } = await supabase
        .from('credit_wallets')
        .upsert({ user_id: tx.user_id, balance_cents: nextBalance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

      if (walletError) {
        throw walletError;
      }

      const { error: updateError } = await supabase
        .from('credit_transactions')
        .update({
          status: 'approved',
          metadata: {
            ...(tx.metadata || {}),
            mercado_pago_status: paymentStatus,
          },
        })
        .eq('id', tx.id)
        .neq('status', 'approved');

      if (updateError) {
        throw updateError;
      }
    }

    const { data: wallet } = await supabase
      .from('credit_wallets')
      .select('balance_cents')
      .eq('user_id', tx?.user_id || payment?.external_reference || '')
      .maybeSingle();

    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('id, type, amount_cents, payment_id, status, created_at')
      .eq('user_id', tx?.user_id || payment?.external_reference || '')
      .order('created_at', { ascending: false })
      .limit(8);

    return res.json({
      paymentStatus,
      balanceCents: wallet?.balance_cents || 0,
      recentTransactions: recentTransactions || [],
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({ error: 'Erro ao verificar pagamento.' });
  }
});

app.post('/api/credits/consume', async (req, res) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const amountCents = Number(req.body?.amountCents);

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'amountCents inválido.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor.' });
    }

    const { data: wallet } = await supabase
      .from('credit_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = wallet?.balance_cents || 0;
    if (currentBalance < amountCents) {
      return res.status(400).json({ error: 'Saldo insuficiente. Recarregue créditos para continuar.' });
    }

    const nextBalance = currentBalance - amountCents;

    const { error: walletError } = await supabase
      .from('credit_wallets')
      .upsert({ user_id: userId, balance_cents: nextBalance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (walletError) {
      throw walletError;
    }

    const { error: insertError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'debit',
      amount_cents: amountCents,
      payment_id: null,
      status: 'completed',
      metadata: {
        reason: 'analysis',
      },
    });

    if (insertError) {
      throw insertError;
    }

    return res.json({ balanceCents: nextBalance, recentTransactions: [] });
  } catch (error) {
    console.error('Erro ao consumir crédito:', error);
    return res.status(500).json({ error: 'Erro ao consumir crédito.' });
  }
});

// Rota para aplicar o bônus de boas-vindas de R$ 6,00 (600 cents)
app.post('/api/credits/welcome-bonus', async (req, res) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor.' });
    }

    // Verifica se o usuário já recebeu o bônus de boas-vindas
    const { data: existingBonus, error: checkError } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'bonus')
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingBonus) {
      return res.json({ success: true, message: 'Bônus já concedido anteriormente.' });
    }

    // Busca a carteira atual ou cria uma nova
    const { data: wallet, error: walletFetchError } = await supabase
      .from('credit_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletFetchError) {
      throw walletFetchError;
    }

    const currentBalance = wallet?.balance_cents || 0;
    const bonusAmount = 600; // R$ 6,00
    const newBalance = currentBalance + bonusAmount;

    // Atualiza o saldo da carteira
    const { error: walletError } = await supabase
      .from('credit_wallets')
      .upsert(
        { user_id: userId, balance_cents: newBalance, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (walletError) {
      throw walletError;
    }

    // Registra a transação de bônus
    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'bonus',
      amount_cents: bonusAmount,
      payment_id: null,
      status: 'completed',
      metadata: {
        reason: 'welcome_bonus',
      },
    });

    if (transactionError) {
      throw transactionError;
    }

    return res.json({ success: true, newBalance });
  } catch (error) {
    console.error('Erro ao aplicar bônus de boas-vindas:', error);
    return res.status(500).json({ error: 'Erro ao aplicar bônus de boas-vindas.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend Express rodando na porta ${PORT}`);
});