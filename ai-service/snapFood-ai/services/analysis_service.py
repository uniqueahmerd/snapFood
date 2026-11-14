from PIL import Image

from services.model_pipeline.orchestrator import ModelOrchestrator


class AnalysisService:
    def __init__(self) -> None:
        self.model_orchestrator = ModelOrchestrator()

    def analyze(
        self,
        image: Image.Image,
        conditions: list[str],
    ) -> dict:
        return self.model_orchestrator.analyze(
            image=image,
            conditions=conditions,
        )