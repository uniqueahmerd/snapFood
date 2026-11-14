import json
import os
import re
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from core.model_registry import (
    get_all_model_info,
    get_model_info,
    list_models,
    clear_model_cache,
)

MODEL_ROOT = Path(__file__).resolve().parents[1] / "models"
CONFIG_DIR = Path(__file__).resolve().parents[1] / "config"
ACTIVE_MODEL_PATH = CONFIG_DIR / "active_model.json"
DEFAULT_MODEL = "snapfood"

MODEL_ARTIFACTS = {
    "snapfood": {
        "filename": "food_vision_model.keras",
        "extension": ".keras",
    },
    "9ja_food_lens": {
        "filename": "best_model.pth",
        "extension": ".pth",
    },
}


def get_active_model() -> str:
    try:
        with ACTIVE_MODEL_PATH.open("r", encoding="utf-8") as file:
            configured_model = json.load(file).get("active_model")
    except (OSError, json.JSONDecodeError, AttributeError):
        configured_model = None

    if configured_model in list_models():
        return configured_model

    return DEFAULT_MODEL


def _get_artifact(model_name: str) -> dict[str, str]:
    if model_name in MODEL_ARTIFACTS:
        return MODEL_ARTIFACTS[model_name]
    if not re.fullmatch(r"[a-z][a-z0-9_-]{1,48}", model_name):
        raise ValueError(f"Unknown model: {model_name}")
    try:
        manifest = json.loads(
            (MODEL_ROOT / model_name / "model" / "model.json").read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Unknown model: {model_name}") from error
    if manifest.get("name") != model_name or not isinstance(manifest.get("filename"), str):
        raise ValueError(f"Unknown model: {model_name}")
    return {"filename": manifest["filename"], "extension": Path(manifest["filename"]).suffix}


def _validate_uploaded_artifact(architecture: str, path: Path, class_count: int) -> None:
    if architecture == "keras_classifier":
        import tensorflow as tf

        model = tf.keras.models.load_model(path, safe_mode=True)
        output_shape = model.output_shape
        if isinstance(output_shape, list) or not output_shape or output_shape[-1] != class_count:
            raise ValueError("Keras model output count must match the number of labels")
        input_shape = model.input_shape
        if isinstance(input_shape, list) or not input_shape:
            raise ValueError("Keras model must accept one RGB image input")
        if input_shape[-1] not in (None, 3) or input_shape[-3:-1] not in ((None, None), (224, 224)):
            raise ValueError("Keras model input must accept RGB images at 224x224")
        return

    if architecture == "efficientnetv2_s_multilabel":
        import torch
        import torch.nn as nn
        from torchvision import models

        model = models.efficientnet_v2_s(weights=None)
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(model.classifier[1].in_features, class_count),
        )
        checkpoint = torch.load(path, map_location="cpu", weights_only=True)
        state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
        model.load_state_dict(state_dict)
        return

    raise ValueError("Unsupported model architecture")


def register_model(
    model_name: str,
    display_name: str,
    architecture: str,
    labels: list[str],
    filename: str,
    content: bytes,
) -> dict[str, Any]:
    if not re.fullmatch(r"[a-z][a-z0-9_-]{1,48}", model_name):
        raise ValueError("Model ID must be 2-49 lowercase letters, numbers, hyphens, or underscores")
    if model_name in list_models():
        raise ValueError("A model with this ID is already registered")
    if not display_name.strip() or len(display_name) > 80:
        raise ValueError("Display name must be between 1 and 80 characters")
    if architecture not in {"keras_classifier", "efficientnetv2_s_multilabel"}:
        raise ValueError("Unsupported model architecture")
    if len(labels) < 2 or len(labels) > 100:
        raise ValueError("Provide between 2 and 100 class labels")
    normalized_labels = [label.strip() for label in labels]
    if any(not label or len(label) > 100 for label in normalized_labels):
        raise ValueError("Class labels must contain between 1 and 100 characters")
    if len({label.casefold() for label in normalized_labels}) != len(normalized_labels):
        raise ValueError("Class labels must be unique")
    expected_extension = ".keras" if architecture == "keras_classifier" else ".pth"
    if Path(filename).suffix.lower() != expected_extension:
        raise ValueError(f"This architecture requires a {expected_extension} artifact")
    if not content or len(content) > 200 * 1024 * 1024:
        raise ValueError("Model artifact must be between 1 byte and 200 MB")

    model_directory = MODEL_ROOT / model_name / "model"
    try:
        model_directory.mkdir(parents=True, exist_ok=False)
    except FileExistsError as error:
        raise ValueError("A model with this ID already exists") from error
    artifact_filename = f"model{expected_extension}"
    artifact_path = model_directory / artifact_filename
    temporary_path = model_directory / f".validation{expected_extension}"
    try:
        temporary_path.write_bytes(content)
        _validate_uploaded_artifact(architecture, temporary_path, len(normalized_labels))
        os.replace(temporary_path, artifact_path)
        manifest = {
            "name": model_name,
            "display_name": display_name.strip(),
            "task": "single-label" if architecture == "keras_classifier" else "multilabel",
            "classes": len(normalized_labels),
            "architecture": architecture,
            "filename": artifact_filename,
            "labels": normalized_labels,
        }
        manifest_path = model_directory / "model.json"
        temporary_manifest = model_directory / ".model.json.tmp"
        temporary_manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        os.replace(temporary_manifest, manifest_path)
    except Exception:
        shutil.rmtree(MODEL_ROOT / model_name, ignore_errors=True)
        raise
    finally:
        temporary_path.unlink(missing_ok=True)

    clear_model_cache(model_name)
    return {**manifest, "active": False, "artifact": {"filename": artifact_filename, "available": True, "size_bytes": artifact_path.stat().st_size, "updated_at": datetime.fromtimestamp(artifact_path.stat().st_mtime, timezone.utc).isoformat()}}


def _version_directory(model_name: str, version_id: str) -> Path:
    _get_artifact(model_name)
    if not re.fullmatch(r"[a-f0-9]{32}", version_id):
        raise ValueError("Invalid model version")
    return MODEL_ROOT / model_name / "versions" / version_id


def _save_current_as_version(model_name: str, artifact_path: Path) -> str | None:
    if not artifact_path.is_file():
        return None
    version_id = uuid.uuid4().hex
    version_path = _version_directory(model_name, version_id) / artifact_path.name
    version_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(artifact_path, version_path)
    return version_id


def list_model_versions(model_name: str) -> list[dict[str, Any]]:
    artifact = _get_artifact(model_name)
    versions_directory = MODEL_ROOT / model_name / "versions"
    try:
        version_directories = list(versions_directory.iterdir())
    except OSError:
        return []

    versions = []
    for version_directory in version_directories:
        if not version_directory.is_dir() or not re.fullmatch(r"[a-f0-9]{32}", version_directory.name):
            continue
        version_path = version_directory / artifact["filename"]
        if not version_path.is_file():
            continue
        stats = version_path.stat()
        versions.append(
            {
                "id": version_directory.name,
                "filename": artifact["filename"],
                "size_bytes": stats.st_size,
                "updated_at": datetime.fromtimestamp(stats.st_mtime, timezone.utc).isoformat(),
            }
        )
    return sorted(versions, key=lambda version: version["updated_at"], reverse=True)


def set_active_model(model_name: str) -> str:
    if model_name not in list_models():
        raise ValueError(f"Unknown model: {model_name}")
    artifact_path = MODEL_ROOT / model_name / "model" / _get_artifact(model_name)["filename"]
    if not artifact_path.is_file():
        raise ValueError(f"Model artifact is missing for: {model_name}")

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    temporary_path = ACTIVE_MODEL_PATH.with_suffix(".tmp")
    temporary_path.write_text(
        json.dumps({"active_model": model_name}, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_path, ACTIVE_MODEL_PATH)
    return model_name


def get_model_status() -> dict[str, Any]:
    active_model = get_active_model()
    models = []
    for model_name in list_models():
        info = get_model_info(model_name)
        artifact = _get_artifact(model_name)
        artifact_path = MODEL_ROOT / model_name / "model" / artifact["filename"]
        artifact_exists = bool(artifact_path and artifact_path.is_file())
        artifact_stats = artifact_path.stat() if artifact_exists and artifact_path else None
        models.append(
            {
                **info,
                "active": model_name == active_model,
                "artifact": {
                    "filename": artifact["filename"],
                    "available": artifact_exists,
                    "size_bytes": artifact_stats.st_size if artifact_stats else None,
                    "updated_at": (
                        datetime.fromtimestamp(artifact_stats.st_mtime, timezone.utc).isoformat()
                        if artifact_stats
                        else None
                    ),
                },
            }
        )

    return {
        "active_model": active_model,
        "registration_enabled": bool(os.getenv("AI_ADMIN_TOKEN")),
        "models": models,
    }


def rollback_model(model_name: str, version_id: str) -> dict[str, Any]:
    artifact = _get_artifact(model_name)
    version_path = _version_directory(model_name, version_id) / artifact["filename"]
    if not version_path.is_file():
        raise ValueError("Model version was not found")

    destination = MODEL_ROOT / model_name / "model" / artifact["filename"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    current_version_id = _save_current_as_version(model_name, destination)
    temporary_path = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
    try:
        shutil.copy2(version_path, temporary_path)
        os.replace(temporary_path, destination)
    finally:
        temporary_path.unlink(missing_ok=True)
    clear_model_cache(model_name)

    return {
        "model": model_name,
        "active": model_name == get_active_model(),
        "restored_version_id": version_id,
        "previous_version_id": current_version_id,
    }


def delete_model_version(model_name: str, version_id: str) -> None:
    version_directory = _version_directory(model_name, version_id)
    artifact_path = version_directory / _get_artifact(model_name)["filename"]
    if not artifact_path.is_file():
        raise ValueError("Model version was not found")
    shutil.rmtree(version_directory)


def list_registered_models() -> list[dict]:
    return get_all_model_info()
