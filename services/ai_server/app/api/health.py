from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def health_check() -> dict[str, object]:
    return {"ok": True, "service": "ai_server"}
