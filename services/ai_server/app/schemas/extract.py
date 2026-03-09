from pydantic import BaseModel, Field


class ExtractionRequest(BaseModel):
    workspace_id: str
    ingestion_item_id: str
    sanitized_text: str = Field(min_length=1)
    source_type: str
    received_at: str
    correlation_id: str


class ExtractionResponse(BaseModel):
    classification: str
    recommended_action: str
    process_number: str | None = None
    deadline_date: str | None = None
    deadline_days: int | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_snippets: list[str]
    provider: str = "gemini"
    model: str
    prompt_version: str
