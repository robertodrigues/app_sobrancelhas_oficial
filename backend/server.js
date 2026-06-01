const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Anthropic } = require('@anthropic-ai/sdk');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Inicialização segura do cliente Anthropic para evitar crash no startup/build caso a chave não esteja definida ainda
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-build-safety',
});

app.use(cors());
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));

app.post('/api/anthropic', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'A variável de ambiente ANTHROPIC_API_KEY não está configurada no servidor.' });
    }

    const response = await anthropic.messages.create({
      model,
      messages,
      max_tokens,
      temperature,
    });

    res.json(response);
  } catch (error) {
    console.error('Erro na API da Anthropic:', error);
    res.status(500).json({ error: 'Erro na API da Anthropic' });
  }
});

app.post('/api/document-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

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

    const key = `photos/${uuidv4()}.${extension}`;

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend Express rodando na porta ${PORT}`);
});