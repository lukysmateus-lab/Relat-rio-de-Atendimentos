import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AttendanceData, RefinedContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    formalReport: {
      type: Type.STRING,
      description: "O texto completo do relatório reescrito em linguagem formal, culta e pedagógica.",
    },
    agreements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Uma lista de encaminhamentos e combinados práticos extraídos do texto.",
    },
  },
  required: ["formalReport", "agreements"],
};

export const refineReport = async (data: AttendanceData): Promise<RefinedContent> => {
  const prompt = `
    DADOS DE ENTRADA:
    - Aluno: ${data.studentName}
    - Turma: ${data.className}
    - Solicitado por: ${data.requestedBy}
    - Motivo: ${data.reason}
    - Notas Brutas da Reunião: ${data.roughNotes}

    SUA MISSÃO:
    Atue como um especialista em Orientação Educacional (SOE). Transforme as notas brutas em um relatório formal.
    1. Reescreva o conteúdo utilizando a norma culta da língua portuguesa.
    2. Substitua termos coloquiais ou julgamentos de valor por terminologia pedagógica adequada (ex: trocar "não para quieto" por "demonstra agitação psicomotora"; trocar "é preguiçoso" por "apresenta resistência na realização das atividades").
    3. Mantenha o tom empático, porém objetivo e documental.
    4. Organize o texto em fluxo lógico: Situação apresentada > Intervenção/Conversa > Combinados.
    5. Extraia uma lista clara de encaminhamentos/combinados para o array 'agreements'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "Você é um assistente sênior de coordenação pedagógica escolar.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as RefinedContent;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
