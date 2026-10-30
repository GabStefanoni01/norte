from typing import Any, TypedDict


class ImprovementState(TypedDict, total=False):
    """Shared, serializable state passed between graph nodes."""

    task: dict[str, Any]
    finding: dict[str, Any]
    architecture: dict[str, Any]
    plan: dict[str, Any]
    agent_trace: list[str]
    human_approval_required: bool
    execution_enabled: bool
