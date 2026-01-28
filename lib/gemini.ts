import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Using exact model name from available models list
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export interface OccupationAnalysis {
  occupation: string;
  confidence: number;
  categories: {
    name: string;
    type: "essential" | "discretionary" | "savings";
    icon: string;
    description: string;
  }[];
  incomePattern: string;
  financialTips: string[];
}

export async function analyzeOccupation(input: string): Promise<OccupationAnalysis> {
  const prompt = `
    Analyze the following occupation/profession input: "${input}".
    
    Return a JSON object with the following structure:
    {
      "occupation": "Formalized Occupation Name",
      "confidence": 0-100 (confidence score),
      "categories": [
        { "name": "Category Name", "type": "essential" | "discretionary" | "savings", "icon": "Lucide icon name", "description": "Short reasoning" }
      ],
      "incomePattern": "Monthly Salary" | "Freelance" | "Business Revenue" | "Irregular",
      "financialTips": ["Tip 1", "Tip 2", "Tip 3"]
    }
    
    Generate 12-15 specific expense categories relevant to this profession.
    Be strictly valid JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Basic cleanup to ensure JSON
  const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(jsonString) as OccupationAnalysis;
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("AI Analysis failed");
  }
}
