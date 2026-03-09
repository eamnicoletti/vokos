from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.schemas.extract import ExtractionRequest, ExtractionResponse

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/", response_model=ExtractionResponse)
def extract_payload(payload: ExtractionRequest) -> ExtractionResponse:
    # M1 returns a deterministic placeholder until M2 model integration lands.
    return ExtractionResponse(
        classification="legal_update",
        recommended_action=f"Revisar evento: {payload.sanitized_text[:80]}",
        confidence=0.45,
        evidence_snippets=[payload.sanitized_text[:180]],
        model="gemini-placeholder",
        prompt_version="m1-draft",
    )
