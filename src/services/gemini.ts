import { GoogleGenerativeAI } from "@google/generative-ai";

// Chave de API configurada
const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  try {
    // Limpeza profunda do base64 para garantir que apenas os dados da imagem sejam enviados
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    
    // Detecta o tipo da imagem ou assume jpeg como padrão seguro
    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Aja como um especialista em visagismo e tricologia.
      Analise esta foto de uma sobrancelha e retorne um diagnóstico técnico.
      
      Responda EXCLUSIVAMENTE um objeto JSON com este formato:
      {
        "density": "baixa" | "média" | "alta",
        "symmetry_score": número de 0 a 100,
        "health_status": "descrição curta da saúde dos fios",
        "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
        "observations": "análise detalhada sobre falhas, espessura e alinhamento"
      }
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extração robusta de JSON (procura o primeiro '{' e o último '}')
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1 || end === 0) {
      throw new Error("A IA não retornou um formato válido.");
    }

    const jsonString = text.substring(start, end);
    return JSON.parse(jsonString);

  } catch (error: any) {
    console.error("Erro na análise Gemini:", error);
    
    // Tratamento de erros específicos
    if (error.message?.includes("API key")) {
      throw new Error("Erro de configuração no servidor. Por favor, tente mais tarde.");
    }
    
    if (error.message?.includes("safety")) {
      throw new Error("A imagem não pôde ser analisada por questões de segurança. Tente uma foto focada apenas na sobrancelha.");
    }

    throw new Error("Não foi possível analisar esta foto. Certifique-se de que a sobrancelha está bem visível e iluminada.");
  }
};