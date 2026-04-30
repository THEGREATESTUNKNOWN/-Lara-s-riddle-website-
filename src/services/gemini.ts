import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Riddle {
  question: string;
  answer: string;
  hint: string;
}

export async function generateRiddle(
  type: string,
  ageGroup: string,
  difficulty: string
): Promise<Riddle> {
  try {
    const prompt = `Generate a unique riddle or joke.
      Type: ${type}
      Age Group: ${ageGroup}
      Difficulty: ${difficulty}
      Return the result as a JSON object with keys "question", "answer", and "hint".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    // Clean markdown if present
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

export async function getPuzzleHint(
  imageDescription: string,
  missingPiecesContext: string
): Promise<string> {
  try {
    const prompt = `The user is playing a picture puzzle. 
      Image Content: ${imageDescription}
      Context: ${missingPiecesContext}
      Provide a subtle hint to help them. Brief and encouraging.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Try focusing on the detail in the corner!";
  } catch (error) {
    console.error("Hint Generation Error:", error);
    return "Focus on the patterns and colors along the edges!";
  }
}
