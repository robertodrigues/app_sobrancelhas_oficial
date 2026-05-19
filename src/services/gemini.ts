import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  // Detecta o mimeType e limpa o base64
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    Você é um especialista em Tricologia e Design de Sobrancelhas. 
    Analise esta imagem técnica de uma sobrancelha e forneça um diagnóstico detalhado.
    
    Retorne OBRIGATORIAMENTE um JSON com estes campos:
    {
      "density": "baixa" | "média" | "alta",
      "symmetry_score": número de 0 a 100,
      "health_status": "string curta",
      "recommendations": ["string1", "string2", "string3"],
      "observations": "parágrafo curto"
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Tenta encontrar o JSON na resposta caso a IA envie texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    return JSON.parse(jsonString);
  } catch (e: any) {
    console.error("Erro detalhado na análise Gemini:", e);
    
    // Se for erro de segurança ou bloqueio, avisar o usuário
    if (e.message?.includes("safety")) {
      throw new Error("A imagem foi bloqueada pelos filtros de segurança. Tente uma foto mais clara da sobrancelha.");
    }
    
    throw new Error("Não conseguimos processar a imagem agora. Tente tirar a foto com mais iluminação.");
  }
};