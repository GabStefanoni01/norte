import argparse
import json
import sys

from pydantic import ValidationError

from app.graphs.improvement_graph import build_improvement_graph
from app.schemas import ImprovementTask


def run_task(payload: dict) -> dict:
    task = ImprovementTask.model_validate(payload)
    graph = build_improvement_graph()
    result = graph.invoke({
        "task": task.to_graph_input(),
        "agent_trace": [],
        "human_approval_required": True,
        "execution_enabled": False,
    })
    return {
        "task_id": task.id,
        "agent_trace": result["agent_trace"],
        "finding": result["finding"],
        "architecture": result["architecture"],
        "plan": result["plan"],
        "human_approval_required": result["human_approval_required"],
        "execution_enabled": result["execution_enabled"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the safe Norte improvement analysis graph.")
    parser.add_argument("--input", help="Path to a JSON task payload. Reads stdin when omitted.")
    args = parser.parse_args()

    try:
        raw = open(args.input, encoding="utf-8").read() if args.input else sys.stdin.read()
        payload = json.loads(raw)
        result = run_task(payload)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (json.JSONDecodeError, ValidationError, KeyError, ValueError) as error:
        print(json.dumps({"error": "invalid_or_unprocessable_task", "detail": str(error)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
