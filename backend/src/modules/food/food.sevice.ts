import { v4 as uuidv4 } from "uuid";

//local imports
import { FoodRepositry } from "./food.repo.js";
import { analyzeWithAI } from "../../services/ai.service.js";

export class FoodService {
  private repo = new FoodRepositry();

  async analyzeFood(image: string, healthCondition: string, userId: string) {
    try {
      if (!image) {
        throw new Error("Image is required");
      }

      // 1️⃣ Call AI service
      const aiResult = await analyzeWithAI(
        image,
        healthCondition ? [healthCondition] : [],
      );

      const { food, confidence, nutrients, advice, substitute, risk_level } =
        aiResult;

      const scanId = uuidv4();
      const id = userId;
      const hasNutrition = nutrients != null;
      const calories = nutrients?.calories ?? 0;

      // ✅ Persist only when the AI service provides nutrition metadata.
      if (hasNutrition && food && food.toLowerCase() !== "unknown") {
        await this.repo.insertToFood(
          scanId,
          id,
          food,
          nutrients,
          calories,
          confidence,
          advice,
          substitute ?? "",
          healthCondition,
          risk_level,
        );
      }

      // Return response in format client expects
      return {
        result: {
          food,
          confidence,
          nutrients,
          advice,
          substitute,
          healthCondition,
          riskLevel: risk_level,
          calories,
          scanId,
        },
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getMealHistory(userId: string) {
    const result = await this.repo.mealHistory(userId);
    // Filter out unknown foods from the results
    return result
      .filter(
        (item) =>
          item.dishName &&
          item.dishName.toLowerCase() !== "unknown" &&
          item.dishName.toLowerCase() !== "unknown_food",
      )
      .map((item) => ({
        dish_name: item.dishName,
        nutrients: item.nutrients,
        calories: item.calories,
        confidence: item.confidence,
        health_assesment: item.healthAssesment,
        recommendations: item.recommendations,
        health_condition: item.healthCondition,
        risk_level: item.riskLevel,
        scanned_at: item.scannedAt,
        created_at: item.createdAt,
      }));
  }
}
