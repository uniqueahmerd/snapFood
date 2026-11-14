
import hmac
import os

from fastapi import Header, HTTPException


def verify_admin_service_token(
    service_token: str | None = Header(
        default=None,
        alias="X-Admin-Service-Token",
    ),
) -> None:
    expected_token = os.getenv("AI_ADMIN_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail="AI admin operations are not configured",
        )

    if not service_token or not hmac.compare_digest(
        service_token, expected_token
    ):
        raise HTTPException(
            status_code=403,
            detail="Forbidden",
        )
