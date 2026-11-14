from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms
from tensorflow.keras.applications.efficientnet import preprocess_input

from core.predictor import BasePredictor
from core.schemas import Prediction, PredictionResult


class UploadedModelPredictor(BasePredictor):
    def __init__(self, config: dict[str, Any]) -> None:
        self.name = config["name"]
        self.labels = config["labels"]
        self.architecture = config["architecture"]
        model_directory = Path(config.get("_model_directory", Path(__file__).resolve().parents[1] / "models" / self.name / "model"))
        self.artifact_path = model_directory / config["filename"]

        if self.architecture == "keras_classifier":
            self.model = tf.keras.models.load_model(self.artifact_path, safe_mode=True)
            self.transform = None
        else:
            self.model = self._load_torch_model()
            self.transform = transforms.Compose([
                transforms.Resize((384, 384)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ])

    def _load_torch_model(self) -> nn.Module:
        model = models.efficientnet_v2_s(weights=None)
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(model.classifier[1].in_features, len(self.labels)),
        )
        checkpoint = torch.load(self.artifact_path, map_location="cpu", weights_only=True)
        state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
        model.load_state_dict(state_dict)
        model.eval()
        return model

    def predict(self, image: Image.Image) -> PredictionResult:
        if self.architecture == "keras_classifier":
            image = image.convert("RGB").resize((224, 224))
            image_array = preprocess_input(np.asarray(image, dtype=np.float32))
            probabilities = self.model.predict(np.expand_dims(image_array, axis=0), verbose=0)[0]
            class_index = int(np.argmax(probabilities))
            confidence = float(probabilities[class_index])
            predictions = (
                [Prediction(food=self.labels[class_index], confidence=round(confidence, 4))]
                if confidence >= 0.5
                else []
            )
        else:
            tensor = self.transform(image.convert("RGB")).unsqueeze(0)
            with torch.no_grad():
                probabilities = torch.sigmoid(self.model(tensor)).squeeze(0)
            predictions = [
                Prediction(food=self.labels[index], confidence=round(float(probability), 4))
                for index, probability in enumerate(probabilities)
                if float(probability) >= 0.5
            ]
            predictions.sort(key=lambda prediction: prediction.confidence, reverse=True)

        return PredictionResult(predictions=predictions, model_name=self.name)