import { AppDataSource } from "../../config/database.config";
import { FoodScan } from "./food.entity";
import { User } from "../user/user.entity";

export type FoodInfo = {
  scanId: string;
  id: string;
  food: string;
  nutrients: object;
  calories: number;
  confidence: number;
  advice: string;
  substitute: string;
  healthCondition?: string;
  risk_level: string;
};

export interface AdminFoodScanFilters {
  search: string;
  lowConfidenceOnly: boolean;
  take: number;
  skip: number;
}

export class FoodRepositry {
  private get repository() {
    return AppDataSource.getRepository(FoodScan);
  }

  async insertToFood(
    scanId: string,
    id: string,
    food: string,
    nutrients: object,
    calories: number,
    confidence: number,
    advice: string,
    substitute: string,
    healthCondition: string,
    risk_level: string,
  ): Promise<FoodScan> {
    const foodScan = this.repository.create({
      id: scanId,
      userId: id,
      dishName: food,
      nutrients,
      calories,
      confidence,
      healthAssesment: advice,
      recommendations: substitute,
      healthCondition: healthCondition ?? null,
      riskLevel: risk_level,
    });

    return this.repository.save(foodScan);
  }

  async mealHistory(userId: string): Promise<FoodScan[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: 10,
    });
  }

  async listForAdmin(filters: AdminFoodScanFilters) {
    const query = this.repository
      .createQueryBuilder("scan")
      .innerJoin(User, "adminUser", "adminUser.id = scan.userId")
      .select("scan.id", "id")
      .addSelect("scan.dishName", "dish_name")
      .addSelect("scan.confidence", "confidence")
      .addSelect("scan.nutrients", "nutrients")
      .addSelect("scan.calories", "calories")
      .addSelect("scan.healthAssesment", "health_assessment")
      .addSelect("scan.recommendations", "recommendations")
      .addSelect("scan.healthCondition", "health_condition")
      .addSelect("scan.riskLevel", "risk_level")
      .addSelect("scan.scannedAt", "scanned_at")
      .addSelect("scan.userId", "user_id")
      .addSelect("adminUser.email", "user_email")
      .addSelect("adminUser.firstName", "first_name")
      .addSelect("adminUser.lastName", "last_name")
      .where(
        "(:search = '' OR scan.dishName ILIKE :pattern OR adminUser.email ILIKE :pattern OR adminUser.firstName ILIKE :pattern OR adminUser.lastName ILIKE :pattern)",
        { search: filters.search, pattern: `%${filters.search}%` },
      )
      .andWhere(
        "(:lowConfidenceOnly = false OR scan.confidence <= :threshold)",
        { lowConfidenceOnly: filters.lowConfidenceOnly, threshold: 0.5 },
      )
      .orderBy("scan.scannedAt", "DESC")
      .skip(filters.skip)
      .take(filters.take);
    const [items, total] = await Promise.all([
      query.clone().getRawMany(),
      query.getCount(),
    ]);
    return {
      items: items.map((item: Record<string, unknown>) => ({
        ...item,
        user_name: [item.first_name, item.last_name].filter(Boolean).join(" "),
      })),
      total,
    };
  }
}
