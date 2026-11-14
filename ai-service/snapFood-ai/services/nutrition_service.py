import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent

FOOD_INFO_PATH = (
    BASE_DIR
    / "models"
    / "snapfood"
    / "food_info.json"
)


class NutritionService:
    """
    Provides nutrition and food metadata.

    The current metadata source contains the original
    SnapFood V1 food database.
    """

    def __init__(self):
        self.food_info = self._load_food_info()

    def _load_food_info(self) -> dict[str, Any]:
        with open(
            FOOD_INFO_PATH,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    def _normalize_food_name(self, food: str) -> str:
        """
        Convert model-specific food labels into the
        canonical food-info key format.
        """

        normalized = food.strip().lower()

        aliases = {
            "moi moi": "moi_moi",
            "banga soup": "banga_soup",
            "egusi soup": "egusi_soup",
            "jollof rice": "jollof_rice",
            "nkwobi": "nkwobi",
            "yam porridge": "yam_porridge",
            "akara": "akara",
            "okpa": "okpa",
            "suya": "suya",
            "tuwo": "tuwo",
        }

        return aliases.get(
            normalized,
            normalized,
        )

    def normalize_food_name(self, food: str) -> str:
        """Return the canonical SnapFood metadata key for a label."""
        return self._normalize_food_name(food)

    def get_food_info(
        self,
        food: str,
    ) -> dict[str, Any] | None:
        """
        Return metadata for a food.

        Model labels may use different naming conventions,
        so they are normalized before lookup.
        """

        normalized_food = self._normalize_food_name(food)

        return self.food_info.get(normalized_food)

    def get_nutrients(
        self,
        food_info: dict[str, Any],
    ) -> dict[str, int]:
        """
        Extract nutrition values from food metadata.
        """

        return {
            "calories": food_info["calories"],
            "carbs": food_info["carbs"],
            "protein": food_info["protein"],
            "fat": food_info["fat"],
        }

    def get_substitute(
        self,
        food_info: dict[str, Any],
    ) -> str | None:
        return food_info.get("substitute")