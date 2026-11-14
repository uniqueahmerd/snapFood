import json
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

from core.predictor import BasePredictor
from core.schemas import Prediction, PredictionResult


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model" 

MODEL_PATH = MODEL_DIR / "best_model.pth"
VOCAB_PATH = MODEL_DIR / "label_vocab.json"

IMAGE_SIZE = 384
CONFIDENCE_THRESHOLD = 0.50
MODEL_NAME = "9ja_food_lens"


class NigerianFoodLensPredictor(BasePredictor):
    """
    Predictor for the Nigerian Food Lens model.

    Architecture:
        EfficientNetV2-S

    Input:
        RGB image resized to 384x384

    Output:
        Multi-label food predictions
    """

    def __init__(self):
        print("Loading Nigerian Food Lens...")

        self.labels = self._load_labels()
        self.model = self._load_model()
        self.transform = self._create_transform()

        print(
            f"Nigerian Food Lens ready! "
            f"{len(self.labels)} classes loaded."
        )

    def _load_labels(self):
        with open(VOCAB_PATH, "r", encoding="utf-8") as file:
            vocab = json.load(file)

        return vocab["labels"]

    def _load_model(self):
        model = models.efficientnet_v2_s(weights=None)

        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(
                model.classifier[1].in_features,
                len(self.labels),
            ),
        )

        checkpoint = torch.load(
            MODEL_PATH,
            map_location="cpu",
            weights_only=False,
        )

        model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        model.eval()

        return model

    def _create_transform(self):
        return transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    def predict(self, image: Image.Image) -> PredictionResult:
        """
        Detect Nigerian foods present in an image.
        """

        image = image.convert("RGB")

        tensor = self.transform(image).unsqueeze(0)

        with torch.no_grad():
            logits = self.model(tensor)
            probabilities = torch.sigmoid(logits).squeeze(0)

        predictions = []

        for index, probability in enumerate(probabilities):
            confidence = float(probability)

            if confidence >= CONFIDENCE_THRESHOLD:
                predictions.append(
                    Prediction(
                        food=self.labels[index],
                        confidence=round(confidence, 4),
                    )
                )

        predictions.sort(
            key=lambda prediction: prediction.confidence,
            reverse=True,
        )

        return PredictionResult(
            predictions=predictions,
            model_name=MODEL_NAME,
        )