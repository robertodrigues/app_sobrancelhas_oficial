const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(express.json({ limit: '20mb' }));

app.post('/api/anthropic', async (req, res) => {
  try {
    const {
      model,
      messages,
      max_tokens,
      temperature,
    } = req.body;

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server rodando na porta ${PORT}`);
});
