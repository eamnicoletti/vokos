from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.extract import router as extract_router

app = FastAPI(title="Vokos AI Server", version="0.1.0")
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(extract_router, prefix="/extract", tags=["extract"])
