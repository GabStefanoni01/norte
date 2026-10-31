from app.main import run_task


def sample_task():
    return {
        "id": "test-improvement-001",
        "title": "Review empty exception handler",
        "summary": "An exception handler appears to swallow an error without recording or handling it.",
        "category": "reliability",
        "evidence": [
            {
                "description": "Empty catch block detected by deterministic discovery.",
                "path": "backend/src/example.js",
                "startLine": 42,
                "endLine": 44,
            }
        ],
    }


def test_graph_runs_agents_in_expected_order_and_stays_non_executing():
    result = run_task(sample_task())

    assert result["agent_trace"] == ["scout", "architect", "planner"]
    assert result["task_id"] == "test-improvement-001"
    assert result["plan"]["humanApprovalRequired"] is True
    assert result["plan"]["executionEnabled"] is False
    assert result["execution_enabled"] is False
    assert result["plan"]["files_to_modify"] == []
    assert result["plan"]["steps"][0].startswith("Inspecionar")
    assert result["plan"]["validation"][0].startswith("Adicionar")
    assert "Aprovação humana" in result["architecture"]["constraints"][-1]


def test_graph_does_not_invent_evidence():
    result = run_task(sample_task())

    assert result["finding"]["evidence"] == sample_task()["evidence"]
    assert result["finding"]["source"] == "control-api-task-payload"


def test_task_id_is_validated():
    payload = sample_task()
    payload["id"] = "../main"

    try:
        run_task(payload)
    except Exception as error:
        assert "id" in str(error)
    else:
        raise AssertionError("Invalid task id should be rejected")
