import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getHypeQuote = async (mode: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate exactly ONE short, punchy, motivational quote for someone in "${mode}" mode.
      
      The vibe must be ONE of these (pick randomly): 
      1. "Unwavering Confidence" (Elizabeth Holmes style)
      2. "Tech Bro Hustle" (Silicon Valley grindset)
      3. "Hype Man" (Your loudest supportive cousin)
      
      Constraints:
      - Max 15 words.
      - Return ONLY the raw text of the quote. 
      - DO NOT include "Here is a quote" or category labels like "Tech Bro:".
      - DO NOT include quotation marks around the output.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    
    let text = response.text || "Bro. Handle dat.";
    // Clean up if the model accidentally adds quotes or labels
    text = text.replace(/^["']|["']$/g, '').replace(/^(Option \d:|Style:|Vibe:).*/i, '').trim();
    return text;
  } catch (error) {
    console.error("Failed to fetch motivation:", error);
    return "Execute.";
  }
};

export const breakDownTask = async (taskDescription: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Break down the following task into 3-5 smaller, actionable subtasks that can each be done in roughly 25 minutes. 
      Task: "${taskDescription}". 
      Keep the subtasks concise, command-based, and punchy.
      Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const tasks = JSON.parse(jsonText);
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error("Failed to breakdown task:", error);
    return [];
  }
};