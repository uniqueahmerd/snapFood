from core.schemas import Prediction


DISH_LABELS = {
    "Akara",
    "Akara And Bread",
    "Amala",
    "Banga soup",
    "Bitterleaf soup",
    "Eba",
    "Edikaikong",
    "Efo Riro",
    "Egusi soup",
    "Ewedu",
    "Fufu",
    "Garri and Groundnut",
    "Gbegiri",
    "Iyan",
    "Jollof rice",
    "Moi Moi",
    "Nkwobi",
    "Ofe Oha",
    "Ofe Owerri",
    "Ogbono soup",
    "Ogi",
    "Ogi and Akara",
    "Okra soup",
    "Spaghetti",
    "Stew",
}


class FoodInterpretationService:
    def get_primary_food(
        self,
        predictions: list[Prediction],
    ) -> Prediction | None:

        if not predictions:
            return None

        dish_predictions = [
            prediction
            for prediction in predictions
            if prediction.food in DISH_LABELS
        ]

        if dish_predictions:
            dish_predictions.sort(
                key=lambda prediction: prediction.confidence,
                reverse=True,
            )

            return dish_predictions[0]

        return predictions[0]