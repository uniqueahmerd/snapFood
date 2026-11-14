import hmac
import json
import logging
import os

from fastapi import FastAPI, Header, HTTPException, Request

from fastapi import Depends
from core.admin_security import verify_admin_service_token

from core.image_utils import decode_base64_image
from core.model_lifecycle import (
    delete_model_version,
    get_model_status,
    list_model_versions,
    register_model,
    rollback_model,
    set_active_model,
)
from core.model_registry import (
    get_all_model_info,
    list_models,
)
from core.log_buffer import ai_log_handler, get_recent_logs
from core.schemas import (
    AnalysisResponse,
    HealthResponse,
    ImagePayload,
    ModelInfo,
)

from services.analysis_service import AnalysisService


APP_VERSION = "1.0.0"


app = FastAPI(
    title="SnapFood AI",
    description=(
        "AI-powered Nigerian food analysis service"
    ),
    version=APP_VERSION,
)


analysis_service = AnalysisService()
logging.getLogger().addHandler(ai_log_handler)


@app.get("/")
def root():
    return {
        "message": "Food AI is running",
        "version": APP_VERSION,
    }


@app.get(
    "/health",
    response_model=HealthResponse,
)
def health():
    return {
        "status": "healthy",
        "service": "snapfood-ai",
        "version": APP_VERSION,
        "models": list_models(),
    }


@app.get(
    "/models",
    response_model=list[ModelInfo],
)
def models():
    return get_all_model_info()


@app.get("/models/status")
def model_status(
       _: None = Depends(verify_admin_service_token),
):
    return get_model_status()


@app.post("/models/register")
async def register_model_artifact(
    request: Request,
    x_admin_service_token: str | None = Header(default=None, alias="X-Admin-Service-Token"),
    x_model_name: str = Header(alias="X-Model-Name"),
    x_model_display_name: str = Header(alias="X-Model-Display-Name"),
    x_model_architecture: str = Header(alias="X-Model-Architecture"),
    x_model_labels: str = Header(alias="X-Model-Labels"),
    x_model_filename: str = Header(alias="X-Model-Filename"),
):
    expected_token = os.getenv("AI_ADMIN_TOKEN")
    if not expected_token:
        raise HTTPException(status_code=503, detail="AI admin operations are not configured")
    if not x_admin_service_token or not hmac.compare_digest(x_admin_service_token, expected_token):
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        labels = json.loads(x_model_labels)
        if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
            raise ValueError("Class labels must be a JSON array of strings")
        return register_model(
            model_name=x_model_name,
            display_name=x_model_display_name,
            architecture=x_model_architecture,
            labels=labels,
            filename=x_model_filename,
            content=await request.body(),
        )
    except (ValueError, TypeError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/admin/logs")
def admin_logs(
    limit: int = 50,
    _: None = Depends(verify_admin_service_token),
):
    return {"logs": get_recent_logs(limit)}


@app.post("/models/{model_name}/activate")
def activate_model(
    model_name: str,
    _: None = Depends(verify_admin_service_token),
):
    try:
        return {
            "active_model": set_active_model(model_name),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/models/{model_name}/versions")
def model_versions(
    model_name: str,
    _: None = Depends(verify_admin_service_token),
):
    try:
        return {"versions": list_model_versions(model_name)}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/models/{model_name}/versions/{version_id}/rollback")
def rollback_model_version(
    model_name: str,
    version_id: str,
    _: None = Depends(verify_admin_service_token),
):
    try:
        return rollback_model(model_name, version_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.delete("/models/{model_name}/versions/{version_id}")
def delete_model_version_artifact(
    model_name: str,
    version_id: str,
    _: None = Depends(verify_admin_service_token),
):
    try:
        delete_model_version(model_name, version_id)
        return {"deleted": True, "model": model_name, "version_id": version_id}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error



@app.post(
    "/analyze",
    response_model=AnalysisResponse,
)
async def analyze_food(
    data: ImagePayload,
):
    print("processing")
    try:
        image = decode_base64_image(
            data.image
        )

        result = analysis_service.analyze(
            image=image,
            conditions=data.conditions,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "ANALYZE ERROR:",
            str(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Food analysis failed",
        ) from error