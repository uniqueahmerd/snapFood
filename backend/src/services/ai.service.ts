import axios from "axios";
import { env } from "../config/env";
import { getAIServiceBaseUrl } from "./ai-url";

interface AIPrediction {
  label: string;
  confidence: number;
  risk_level: string;
}

interface AINutrients {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface AIResponse {
  food: string;
  confidence: number;
  predictions: AIPrediction[];
  nutrients: AINutrients | null;
  substitute: string | null;
  advice: string;
  risk_level: string;
  risk_score: number;
  error?: string; // To handle error cases from the AI service
}

export const analyzeWithAI = async (
  imageBase64: string,
  conditions: string[],
) => {
  const aiUrl = getAIServiceBaseUrl(env.AI_URL ?? "");
  if (!aiUrl) {
    throw new Error("AI_URL is not configured");
  }
  const response = await axios.post<AIResponse>(
    `${aiUrl}/analyze`,
    { image: imageBase64, conditions },
    { timeout: 30000 }, // 30-second timeout for the AI model
  );
  const aiResponse = response.data;
   console.log("original response", aiResponse);
   
  const advice = String(aiResponse.advice);

  // Handle explicit errors returned from the AI service
  if (aiResponse.error) {
    console.log(aiResponse.error);
    throw new Error(aiResponse.error);
  }
 

  // Validate the structure of the successful response
  // if (
  //   !aiResponse ||
  //   typeof advice !== "string" ||
  //   typeof aiResponse.food !== "string" ||
  //   typeof aiResponse.nutrients !== "object" ||
  //   typeof aiResponse.confidence !== "number" ||
  //   typeof aiResponse.substitute !== "string" ||
  //   typeof aiResponse.risk_level !== "string" ||
  //   typeof aiResponse.risk_score !== "number"
  // ) {
  //   throw new Error("Invalid or incomplete AI response structure");
  // }

  return {
    advice: advice,
    food: aiResponse.food,
    nutrients: aiResponse.nutrients,
    risk_level: aiResponse.risk_level,
    substitute: aiResponse.substitute,
    confidence: aiResponse.confidence,
  };
};
