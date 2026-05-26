const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const anthropic = new Anthropic();

app.use(express.json());

app.post('/api/anthropic', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await anthropic.generateText({
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7
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