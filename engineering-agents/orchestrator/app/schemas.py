from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EvidenceItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(min_length=1, max_length=2000)
    path: str | None = Field(default=None, max_length=500)
    startLine: int | None = Field(default=None, gt=0)
    endLine: int | None = Field(default=None, gt=0)
    url: str | None = Field(default=None, max_length=1000)


class ImprovementTask(BaseModel):
    """Minimal, strict input contract for a task obtained from Control API."""

    model_config = ConfigDict(extra="ignore")

    id: str = Field(pattern=r"^[A-Za-z0-9._-]{1,100}$")
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=4000)
    category: str = Field(min_length=1, max_length=80)
    evidence: list[EvidenceItem] = Field(default_factory=list, max_length=50)

    def to_graph_input(self) -> dict[str, Any]:
        return self.model_dump(
        mode="json",
        exclude_none=True,
    )
