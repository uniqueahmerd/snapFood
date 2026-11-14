import importlib
import json
from pathlib import Path

from core.predictor import BasePredictor


_MODEL_REGISTRY = {
    "snapfood": {
        "module": "models.snapfood.predictor",
        "class": "SnapFoodPredictor",
        "display_name": "SnapFood V1",
        "task": "single-label",
        "classes": 10,
    },
    "9ja_food_lens": {
        "module": "models.9ja_food_lens.predictor",
        "class": "NigerianFoodLensPredictor",
        "display_name": "Nigerian Food Lens",
        "task": "multilabel",
        "classes": 41,
    },
}

MODEL_ROOT = Path(__file__).resolve().parents[1] / "models"


def _registered_models() -> dict[str, dict]:
    registered = {}
    try:
        directories = list(MODEL_ROOT.iterdir())
    except OSError:
        return registered

    for directory in directories:
        manifest_path = directory / "model" / "model.json"
        if not directory.is_dir() or not manifest_path.is_file():
            continue
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        model_name = manifest.get("name")
        if (
            isinstance(model_name, str)
            and model_name == directory.name
            and model_name not in _MODEL_REGISTRY
            and manifest.get("architecture") in {"keras_classifier", "efficientnetv2_s_multilabel"}
            and isinstance(manifest.get("labels"), list)
        ):
            registered[model_name] = {
                **manifest,
                "_model_directory": directory / "model",
            }
    return registered


def _all_models() -> dict[str, dict]:
    return {**_MODEL_REGISTRY, **_registered_models()}


_predictor_instances: dict[str, BasePredictor] = {}


def list_models() -> list[str]:
    return list(_all_models().keys())


def get_model_info(model_name: str) -> dict:
    registry = _all_models()
    if model_name not in registry:
        raise ValueError(
            f"Unknown model: {model_name}"
        )

    config = registry[model_name]

    return {
        "name": model_name,
        "display_name": config["display_name"],
        "task": config["task"],
        "classes": config["classes"],
    }


def get_all_model_info() -> list[dict]:
    return [
        get_model_info(model_name)
        for model_name in list_models()
    ]


def get_model(model_name: str) -> BasePredictor:
    registry = _all_models()
    if model_name not in registry:
        raise ValueError(
            f"Unknown model: {model_name}"
        )

    if model_name in _predictor_instances:
        return _predictor_instances[model_name]

    config = registry[model_name]

    if "architecture" in config:
        from core.uploaded_predictor import UploadedModelPredictor

        predictor = UploadedModelPredictor(config)
        _predictor_instances[model_name] = predictor
        return predictor

    module = importlib.import_module(
        config["module"]
    )

    predictor_class = getattr(
        module,
        config["class"],
    )

    predictor = predictor_class()

    _predictor_instances[model_name] = predictor

    return predictor


def clear_model_cache(model_name: str) -> None:
    _predictor_instances.pop(model_name, None)