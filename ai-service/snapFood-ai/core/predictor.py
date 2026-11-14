from abc import ABC, abstractmethod

from PIL import Image

from core.schemas import PredictionResult


class BasePredictor(ABC):
    """
    Common interface for all SnapFood AI models.

    Every model predictor must implement predict().
    """

    @abstractmethod
    def predict(self, image: Image.Image) -> PredictionResult:
        """
        Run food detection/classification on an image.

        Args:
            image: PIL image.

        Returns:
            Normalized PredictionResult.
        """
        raise NotImplementedError