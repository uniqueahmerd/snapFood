import unittest

from core.schemas import Prediction, PredictionResult
from services.model_pipeline.orchestrator import ModelOrchestrator


class FakePredictor:
    def __init__(self, results):
        self.results = results
        self.calls = 0

    def predict(self, image):
        self.calls += 1
        return self.results.pop(0)


class FakeNutritionService:
    def __init__(self, records):
        self.records = records
        self.lookups = []

    def get_food_info(self, food):
        self.lookups.append(food)
        return self.records.get(food.strip().lower())

    def normalize_food_name(self, food):
        return food.strip().lower()

    def get_nutrients(self, food_info):
        return food_info

    def get_substitute(self, food_info):
        return None


class FakeHealthService:
    def generate_advice(self, food_info, conditions):
        return "advice", 10, []

    def get_risk_level(self, score):
        return "Low Risk"


class ModelOrchestrationTests(unittest.TestCase):
    def make_orchestrator(self, primary_results, secondary_results, records):
        primary = FakePredictor(primary_results)
        secondary = FakePredictor(secondary_results)
        nutrition = FakeNutritionService(records)
        health = FakeHealthService()
        orchestrator = ModelOrchestrator(
            model_provider=lambda name: (
                primary if name == "snapfood" else secondary
            ),
            nutrition_service=nutrition,
            health_service=health,
        )
        return orchestrator, primary, secondary, nutrition

    def test_snapfood_remains_primary_and_keeps_its_label(self):
        primary_results = [
            PredictionResult(
                predictions=[
                    Prediction(food="jollof_rice", confidence=0.91)
                ],
                model_name="snapfood",
            )
        ]
        orchestrator, primary, secondary, nutrition = (
            self.make_orchestrator(
                primary_results,
                [],
                {"jollof_rice": {"calories": 600, "carbs": 12, "protein": 28, "fat": 45, "ingredients": []}},
            )
        )

        result = orchestrator.analyze(object(), ["Diabetic"])

        self.assertEqual(result["food"], "jollof_rice")
        self.assertEqual(result["model"], "snapfood")
        self.assertEqual(result["nutrition_source"], "snapfood")
        self.assertEqual(primary.calls, 1)
        self.assertEqual(secondary.calls, 0)
        self.assertEqual(nutrition.lookups, ["jollof_rice"])

    def test_9ja_is_used_only_after_snapfood_cannot_identify(self):
        primary_results = [
            PredictionResult(
                predictions=[],
                model_name="snapfood",
            )
        ]
        secondary_results = [
            PredictionResult(
                predictions=[
                    Prediction(food="Jollof rice", confidence=0.82)
                ],
                model_name="9ja_food_lens",
            )
        ]
        orchestrator, primary, secondary, nutrition = (
            self.make_orchestrator(
                primary_results,
                secondary_results,
                {"jollof rice": {"calories": 600, "carbs": 12, "protein": 28, "fat": 45, "ingredients": []}},
            )
        )

        result = orchestrator.analyze(object(), ["Diabetic"])

        self.assertEqual(result["food"], "Jollof rice")
        self.assertEqual(result["model"], "9ja_food_lens")
        self.assertEqual(result["nutrition_source"], "snapfood")
        self.assertEqual(primary.calls, 1)
        self.assertEqual(secondary.calls, 1)
        self.assertIn("Jollof rice", nutrition.lookups)

    def test_primary_is_rechecked_when_9ja_has_no_nutrition_record(self):
        primary_results = [
            PredictionResult(predictions=[], model_name="snapfood"),
            PredictionResult(
                predictions=[
                    Prediction(food="jollof_rice", confidence=0.91)
                ],
                model_name="snapfood",
            ),
        ]
        secondary_results = [
            PredictionResult(
                predictions=[
                    Prediction(food="Jollof rice", confidence=0.82)
                ],
                model_name="9ja_food_lens",
            )
        ]
        orchestrator, primary, secondary, nutrition = (
            self.make_orchestrator(
                primary_results,
                secondary_results,
                {"jollof_rice": {"calories": 600, "carbs": 12, "protein": 28, "fat": 45, "ingredients": []}},
            )
        )

        result = orchestrator.analyze(object(), ["Diabetic"])

        self.assertEqual(result["food"], "jollof_rice")
        self.assertEqual(result["model"], "snapfood")
        self.assertEqual(result["nutrition_source"], "snapfood")
        self.assertEqual(primary.calls, 2)
        self.assertEqual(secondary.calls, 1)


if __name__ == "__main__":
    unittest.main()
