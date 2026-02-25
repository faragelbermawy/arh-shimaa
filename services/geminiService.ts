
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async askAssistant(query: string): Promise<string> {
    const response: GenerateContentResponse = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `You are MDRO LTC Assistant, an expert medical infection control specialist. 
        Provide clear, concise, and evidence-based answers. 
        CRITICAL: ALWAYS use English for EVERYTHING. 
        NEVER use Arabic language, Arabic numerals (٠١٢٣٤٥٦٧٨٩), or Arabic months. 
        All reports, summaries, and responses MUST be in English only.
        Always respond in a professional clinical tone.`,
        temperature: 0.7,
      },
    });
    return response.text || "I'm sorry, I couldn't generate a response at this time.";
  }

  async analyzeReport(base64Data: string, mimeType: string = 'image/jpeg') {
    const parts: any[] = [
      { text: `Strictly analyze this clinical document or photo. 
      
      OBJECTIVE: Extract ALL MDRO transmission data.
      
      RULES:
      1. IDENTIFY CATEGORY: "MDRO Finding" or "Audit".
      2. IF "MDRO Finding": 
         - Set isMdroFinding: true.
         - EXTRACT ALL UNITS: Look for names like LTC 6, RICU, LTC 5, etc. List them all.
         - EXTRACT ALL ORGANISMS: Look for pathogens like ACB-MDR, CRE, MRSA, VRE, etc. List them all.
         - EXTRACT DATE: Exact date found in the document (e.g., 25/1).
         - SUMMARY: Provide a brief clinical takeaway of the risk level.
      3. IF "Audit":
         - Set isMdroFinding: false.
         - Extract Unit, Date, and specific scores (0-100).
      
      CRITICAL: Return ONLY English JSON. All text fields (summary, unitName, mdroTransmission) MUST be in English.
      Format dates as DD-MMM-YYYY if possible, or DD/MM.` }
    ];

    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            handHygiene: { type: Type.NUMBER },
            ppe: { type: Type.NUMBER },
            environmental: { type: Type.NUMBER },
            equipment: { type: Type.NUMBER },
            unitName: { type: Type.STRING, description: "All units found, e.g., 'LTC 6, RICU'" },
            reportDate: { type: Type.STRING },
            mdroTransmission: { type: Type.STRING, description: "All pathogens found, e.g., 'ACB-MDR, CRE'" },
            summary: { type: Type.STRING },
            isMdroFinding: { type: Type.BOOLEAN },
            auditType: { type: Type.STRING },
            staffGroup: { type: Type.STRING },
            auditor: { type: Type.STRING },
            audienceName: { type: Type.STRING },
            checkedItems: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["handHygiene", "ppe", "environmental", "equipment", "summary", "unitName", "mdroTransmission", "reportDate", "isMdroFinding"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }

  async generateQuiz(topic: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 multiple choice questions for a quiz about ${topic}. Use English only for dates and numbers.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }
}

export const gemini = new GeminiService();
