from pydantic import BaseModel, Field


class Prediction(BaseModel):
    food: str
    confidence: float = Field(ge=0.0, le=1.0)


class PredictionResult(BaseModel):
    predictions: list[Prediction]
    model_name: str


class ImagePayload(BaseModel):
    image: str = Field(min_length=1)
    conditions: list[str] = Field(min_length=1)


class Nutrients(BaseModel):
    calories: int = Field(ge=0)
    carbs: int = Field(ge=0)
    protein: int = Field(ge=0)
    fat: int = Field(ge=0)


class AnalysisResponse(BaseModel):
    food: str
    confidence: float = Field(ge=0.0, le=1.0)
    model: str
    identified_by: str | None = None

    predictions: list[Prediction] = Field(
        default_factory=list
    )

    nutrition_source: str | None = None
    nutrition_key: str | None = None
    nutrients: Nutrients | None = None

    advice: str
    substitute: str | None = None

    risk_level: str
    risk_score: int = Field(ge=0, le=100)

    flags: list[str] = Field(
        default_factory=list
    )


class ModelInfo(BaseModel):
    name: str
    display_name: str
    task: str
    classes: int


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models: list[str]