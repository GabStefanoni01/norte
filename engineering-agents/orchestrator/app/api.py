import os
import secrets
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import ValidationError

from app.main import run_task
from app.schemas import ImprovementTask

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(
    title="Norte Engineering Agents Orchestrator",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
)


def require_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    expected = os.getenv("AGENTS_ORCHESTRATOR_TOKEN", "")
    if len(expected) < 32:
        raise HTTPException(status_code=503, detail="orchestrator_not_configured")
    supplied = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    if not secrets.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {"status": "ok", "service": "langgraph-orchestrator", "executionEnabled": False}


@app.post("/v1/analyze", dependencies=[Depends(require_service_token)])
def analyze_task(task: ImprovementTask) -> dict:
    try:
        return run_task(task.model_dump(mode="json", exclude_none=True))
    except ValidationError as error:
        raise HTTPException(status_code=422, detail="invalid_task_payload") from error
