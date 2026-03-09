import os

from fastapi import Header, HTTPException, status


async def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    expected = os.getenv("INTERNAL_SERVICE_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="INTERNAL_SERVICE_TOKEN is not configured",
        )

    if x_internal_token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
