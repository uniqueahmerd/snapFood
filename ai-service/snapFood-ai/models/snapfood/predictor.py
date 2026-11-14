import numpy as np
import tensorflow as tf
from pathlib import Path
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input

from core.predictor import BasePredictor
from core.schemas import Prediction, PredictionResult
from models.snapfood.labels import FOOD_LABELS


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "food_vision_model.keras"

IMAGE_SIZE = 224
CONFIDENCE_THRESHOLD = 0.50
MODEL_NAME = "snapfood"


class SnapFoodPredictor(BasePredictor):
    """
    Predictor for the original SnapFood food classification model.

    Architecture:
        TensorFlow / Keras EfficientNetB3

    Input:
        RGB image resized to 224x224

    Output:
        Single food prediction
    """

    def __init__(self):
        print("Loading SnapFood V1...")

        self.model = self._load_model()
        
        print(
            f"SnapFood V1 ready! "
            f"{len(FOOD_LABELS)} classes loaded."
        )

    def _load_model(self):
        model = tf.keras.models.load_model(MODEL_PATH)

        return model

    def _preprocess_image(self, image: Image.Image):
        image = image.convert("RGB")
        image = image.resize((IMAGE_SIZE, IMAGE_SIZE))

        image_array = np.asarray(
            image,
            dtype=np.float32,
        )

        image_array = preprocess_input(image_array)

        image_array = np.expand_dims(
            image_array,
            axis=0,
        )

        return image_array

    def predict(self, image: Image.Image) -> PredictionResult:
        """
        Classify an image using the original SnapFood model.
        """

        image_array = self._preprocess_image(image)

        predictions = self.model.predict(
            image_array,
            verbose=0,
        )[0]

        class_index = int(np.argmax(predictions))
        confidence = float(predictions[class_index])

        if confidence < CONFIDENCE_THRESHOLD:
            return PredictionResult(
                predictions=[],
                model_name=MODEL_NAME,
            )

        predicted_food = FOOD_LABELS[class_index]

        return PredictionResult(
            predictions=[
                Prediction(
                    food=predicted_food,
                    confidence=round(confidence, 4),
                )
            ],
            model_name=MODEL_NAME,
        )