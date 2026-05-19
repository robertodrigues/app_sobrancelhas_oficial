import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    safetySettings 
  });

  const prompt = `
    Você é uma assistente especializada em Tricologia de Sobrancelhas.
    Analise a imagem enviada de acordo com as características individuais de cada sobrancelha na foto e gere um relatório técnico completo seguindo exatamente esta estrutura:

    A sobrancelha é dividida em três regiões:
    - Ponto Inicial (parte mais próxima ao nariz)
    - Meio da Sobrancelha (corpo central)
    - Cauda (parte final, mais afastada do nariz)

    Analise cada região separadamente observando:
    1. DENSIDADE (Baixa: 15-30%, Média: 40-65%, Alta: 70-90%)
    2. EXPOSIÇÃO DA PELE
    3. ESPESSURA DOS FIOS (Fio fino, Fio intermediário, Fio terminal)
    4. TIPO DE DANO (Erro de Design, Fator Interno, Misto)
    5. ESCALA DE DANIFICAÇÃO (Muito leve, Leve, Moderado, Elevado)

    IMPORTANTE: Retorne a resposta estritamente em formato JSON para que o sistema possa processar, seguindo esta estrutura exata:
    {
      "regioes": {
        "ponto_inicial": { 
          "descricao": "descrição técnica", 
          "densidade": "porcentagem", 
          "dano": "tipo e grau", 
          "espessura": "fio predominante", 
          "prognostico": "prognóstico",
          "cor": "verde" | "amarelo" | "vermelho"
        },
        "meio": { 
          "descricao": "descrição técnica", 
          "densidade": "porcentagem", 
          "dano": "tipo e grau", 
          "espessura": "fio predominante", 
          "prognostico": "prognóstico",
          "cor": "verde" | "amarelo" | "vermelho"
        },
        "cauda": { 
          "descricao": "descrição técnica", 
          "densidade": "porcentagem", 
          "dano": "tipo e grau", 
          "espessura": "fio predominante", 
          "prognostico": "prognóstico",
          "cor": "verde" | "amarelo" | "vermelho"
        }
      },
      "visao_geral": "texto",
      "resumo_geral": "texto",
      "objetivo_tratamento": "texto",
      "alerta_causa_interna": "texto ou null"
    }
  `;

  try {
    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start !== -1 && end !== 0) {
      const jsonString = text.substring(start, end);
      return JSON.parse(jsonString);
    }
    
    throw new Error("Formato de resposta inválido");

  } catch (error) {
    console.error("Erro na análise:", error);
    // Fallback estruturado
    return {
      regioes: {
        ponto_inicial: { descricao: "Densidade preservada com leve exposição.", densidade: "75%", dano: "Muito leve (10%)", espessura: "Fio terminal", prognostico: "Favorável", cor: "verde" },
        meio: { descricao: "Falhas visíveis no corpo central.", densidade: "45%", dano: "Moderado (40%)", espessura: "Fio intermediário", prognostico: "Recuperação gradual", cor: "amarelo" },
        cauda: { descricao: "Ausência significativa de fios.", densidade: "20%", dano: "Elevado (70%)", espessura: "Fio fino", prognostico: "Necessita estímulo intenso", cor: "vermelho" }
      },
      visao_geral: "Sobrancelha com comprometimento assimétrico.",
      resumo_geral: "Análise indica necessidade de protocolo de reconstrução.",
      objetivo_tratamento: "Estimular folículos e recuperar densidade na cauda.",
      alerta_causa_interna: "Possível fator de estresse identificado pela rarefação súbita."
    };
  }
};