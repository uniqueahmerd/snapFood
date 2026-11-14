from typing import Any, Callable

from core.model_lifecycle import get_active_model
from core.model_registry import get_model
from core.schemas import Prediction, PredictionResult
from services.health_service import HealthService
from services.nutrition_service import NutritionService


PRIMARY_MODEL = "snapfood"
SECONDARY_MODEL = "9ja_food_lens"


class ModelOrchestrator:
    """Coordinate independent model predictions and nutrition lookup."""

    def __init__(
        self,
        model_provider: Callable[[str], Any] | None = None,
        nutrition_service: NutritionService | None = None,
        health_service: HealthService | None = None,
    ) -> None:
        self.model_provider = model_provider or get_model
        self.nutrition_service = nutrition_service or NutritionService()
        self.health_service = health_service or HealthService()

    def _predict(self, model_name: str, image: Any) -> PredictionResult:
        predictor = self.model_provider(model_name)
        return predictor.predict(image)

    @staticmethod
    def _select_prediction(
        prediction_result: PredictionResult,
    ) -> Prediction | None:
        if not prediction_result.predictions:
            return None

        return max(
            prediction_result.predictions,
            key=lambda prediction: prediction.confidence,
        )

    def _build_result(
        self,
        prediction: Prediction,
        prediction_result: PredictionResult,
        conditions: list[str],
    ) -> dict[str, Any]:
        food_info = self.nutrition_service.get_food_info(prediction.food)
        model_name = prediction_result.model_name

        if not food_info:
            return {
                "food": prediction.food,
                "confidence": prediction.confidence,
                "model": model_name,
                "identified_by": model_name,
                "predictions": prediction_result.predictions,
                "nutrition_source": None,
                "nutrition_key": None,
                "nutrients": None,
                "advice": (
                    "Food identified, but nutrition information is "
                    "not available yet."
                ),
                "substitute": None,
                "risk_level": "unknown",
                "risk_score": 0,
                "flags": [],
            }

        nutrients = self.nutrition_service.get_nutrients(food_info)
        substitute = self.nutrition_service.get_substitute(food_info)
        advice, risk_score, flags = self.health_service.generate_advice(
            food_info,
            conditions,
        )

        return {
            "food": prediction.food,
            "confidence": prediction.confidence,
            "model": model_name,
            "identified_by": model_name,
            "predictions": prediction_result.predictions,
            "nutrition_source": "snapfood",
            "nutrition_key": self.nutrition_service.normalize_food_name(
                prediction.food
            ),
            "nutrients": nutrients,
            "advice": advice,
            "substitute": substitute,
            "risk_level": self.health_service.get_risk_level(risk_score),
            "risk_score": risk_score,
            "flags": flags,
        }

    def analyze(self, image: Any, conditions: list[str]) -> dict[str, Any]:
        if not conditions:
            raise ValueError("Please select at least one health condition")

        active_model = get_active_model()
        if active_model != PRIMARY_MODEL:
            active_result = self._predict(active_model, image)
            active_prediction = self._select_prediction(active_result)
            if active_prediction is not None:
                return self._build_result(
                    active_prediction,
                    active_result,
                    conditions,
                )

            return {
                "food": "unknown_food",
                "confidence": 0,
                "model": active_model,
                "identified_by": None,
                "predictions": [],
                "nutrition_source": None,
                "nutrition_key": None,
                "nutrients": None,
                "advice": (
                    "Food not recognized with high confidence. "
                    "Cannot generate advice."
                ),
                "substitute": None,
                "risk_level": "unknown",
                "risk_score": 0,
                "flags": [],
            }

        primary_result = self._predict(PRIMARY_MODEL, image)
        primary_prediction = self._select_prediction(primary_result)

        if primary_prediction is not None:
            return self._build_result(
                primary_prediction,
                primary_result,
                conditions,
            )

        secondary_result = self._predict(SECONDARY_MODEL, image)
        secondary_prediction = self._select_prediction(secondary_result)

        if secondary_prediction is not None:
            secondary_food_info = self.nutrition_service.get_food_info(
                secondary_prediction.food
            )

            if secondary_food_info is not None:
                return self._build_result(
                    secondary_prediction,
                    secondary_result,
                    conditions,
                )

            primary_retry_result = self._predict(PRIMARY_MODEL, image)
            primary_retry_prediction = self._select_prediction(
                primary_retry_result
            )

            if primary_retry_prediction is not None:
                return self._build_result(
                    primary_retry_prediction,
                    primary_retry_result,
                    conditions,
                )

            return self._build_result(
                secondary_prediction,
                secondary_result,
                conditions,
            )

        return {
            "food": "unknown_food",
            "confidence": 0,
            "model": PRIMARY_MODEL,
            "identified_by": None,
            "predictions": [],
            "nutrition_source": None,
            "nutrition_key": None,
            "nutrients": None,
            "advice": (
                "Food not recognized with high confidence. "
                "Cannot generate advice."
            ),
            "substitute": None,
            "risk_level": "unknown",
            "risk_score": 0,
            "flags": [],
        }
