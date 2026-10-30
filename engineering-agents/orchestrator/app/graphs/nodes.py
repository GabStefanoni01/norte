from typing import Any

from app.graphs.state import ImprovementState


def scout_node(state: ImprovementState) -> dict[str, Any]:
    """Normalize the supplied finding; do not inspect or modify repository files."""
    task = state["task"]
    evidence = task.get("evidence", [])
    finding = {
        "task_id": task["id"],
        "title": task["title"],
        "summary": task["summary"],
        "category": task["category"],
        "evidence": evidence,
        "source": "control-api-task-payload",
        "limitations": [
            "This first version only reasons over evidence supplied by Control API.",
            "No repository files are read or executed.",
        ],
    }
    return {
        "finding": finding,
        "agent_trace": [*state.get("agent_trace", []), "scout"],
    }


def architect_node(state: ImprovementState) -> dict[str, Any]:
    """Produce a bounded architecture assessment from the normalized finding."""
    finding = state["finding"]
    architecture = {
        "problem_statement": finding["summary"],
        "category": finding["category"],
        "proposed_approach": (
            "Prepare a narrowly scoped change proposal based on the supplied evidence. "
            "Do not modify source files during analysis."
        ),
        "constraints": [
            "Preserve existing application architecture and public contracts.",
            "Do not access secrets or environment files.",
            "Do not modify main or develop.",
            "Require explicit human approval before implementation.",
        ],
        "unknowns": [
            "The repository context has not yet been loaded by a read-only tool.",
            "The proposed approach must be checked against the current source before implementation.",
        ],
    }
    return {
        "architecture": architecture,
        "agent_trace": [*state.get("agent_trace", []), "architect"],
    }


def planner_node(state: ImprovementState) -> dict[str, Any]:
    """Create a reviewable plan; this node never grants execution permission."""
    task = state["task"]
    plan = {
        "task_id": task["id"],
        "objective": task["title"],
        "steps": [
            "Inspect the affected source and its surrounding tests in read-only mode.",
            "Confirm the proposed change against repository conventions and dependencies.",
            "Prepare a minimal implementation in an isolated workspace after approval.",
            "Run only the explicitly approved validation commands.",
        ],
        "files_to_modify": [],
        "risks": [
            "The exact files and change scope remain unverified until read-only inspection.",
        ],
        "validation": [
            "Add or update focused automated tests.",
            "Run the relevant existing test suite and static checks.",
        ],
        "rollback": "Discard the isolated worktree if validation fails; do not merge or push.",
        "humanApprovalRequired": True,
        "executionEnabled": False,
    }
    return {
        "plan": plan,
        "human_approval_required": True,
        "execution_enabled": False,
        "agent_trace": [*state.get("agent_trace", []), "planner"],
    }
