import { PROMPT_ESPECIALISTA } from '../constants/prompt';

const OPENAI_KEY = "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";

export async function analyzeWithGPT4o(base64Image: string) {
  const mimeType = "image/jpeg";
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Data}` }
          },
          { type: 'text', text: PROMPT_ESPECIALISTA }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GPT-4o HTTP ${response.status}: ${errorData.error?.message || 'Erro desconhecido'}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}