import { AppDataSource } from "../../config/database.config";
export class DashboardRepositry {
  async getSummary(userId: string) {
    const todayCaloriesQuery =
      "SELECT COALESCE(SUM((nutrients->>'calories')::INT), 0) AS total_calories FROM food_scan WHERE user_id = $1 AND DATE(scanned_at) = CURRENT_DATE";

    const mealsCountQuery =
      "SELECT COUNT(*)::INT AS count FROM food_scan WHERE user_id = $1";

    const [caloriesRes, mealsRes, riskRes] = await Promise.all([
      AppDataSource.query(todayCaloriesQuery, [userId]),
      AppDataSource.query(mealsCountQuery, [userId]),
      AppDataSource.query(
        "SELECT COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk, COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk FROM food_scan WHERE user_id = $1",
        [userId],
      ),
    ]);

    const riskCounts = riskRes[0];
    const totalScans = Number(mealsRes[0].count ?? 0);
    const healthScore = totalScans === 0
      ? null
      : Math.max(0, 100 - Number(riskCounts.high_risk ?? 0) * 10 - Number(riskCounts.medium_risk ?? 0) * 4);

    return {
      todaysCalories: caloriesRes[0].total_calories,
      mealsLogged: totalScans,
      healthScore,
      caloriesTarget: null,
    };
  }

  async getRecentScans(userId: string) {
    const query =
      "SELECT dish_name AS food_name, confidence, (nutrients->>'calories')::INT AS calories, health_condition, risk_level, scanned_at FROM food_scan WHERE user_id = $1 AND LOWER(dish_name) NOT IN ('unknown', 'unknown_food') ORDER BY scanned_at DESC LIMIT 5;";
    const result = await AppDataSource.query(query, [userId]);
    return result;
  }

  async getWeeklyTrend(userId: string) {
    const query =
      "SELECT TO_CHAR(DATE(scanned_at), 'Day') AS day, SUM((nutrients->>'calories')::INT)::int AS calories FROM food_scan WHERE user_id = $1 AND scanned_at >= NOW() - INTERVAL '7 days' GROUP BY day, DATE(scanned_at) ORDER BY DATE(scanned_at);";
    const result = await AppDataSource.query(query, [userId]);
    return result;
  }

  async getNutritionBreakdown(userId: string) {
    const query =
      "SELECT  SUM((nutrients->>'protein')::INT) AS protein, SUM((nutrients->>'carbs')::INT) AS carbs, SUM((nutrients->>'fat')::INT) AS fat, SUM((nutrients->>'fiber')::INT) AS fiber FROM food_scan WHERE user_id = $1 AND scanned_at >= NOW() - INTERVAL '7 days';";
    const result = await AppDataSource.query(query, [userId]);
    return result[0];
  }

  async getHealthRisk(userId: string) {
    const query =
      "SELECT DATE_TRUNC('week', scanned_at) AS week, COUNT(*) FILTER (WHERE risk_level = 'high') AS high, COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium, COUNT(*) FILTER (WHERE risk_level = 'low') AS low FROM food_scan WHERE user_id = $1 GROUP BY week ORDER BY week;";
    const result = await AppDataSource.query(query, [userId]);
    return result;
  }
}
