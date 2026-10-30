from fastapi.testclient import TestClient

from app.api import app

client = TestClient(app)
TOKEN = "test-orchestrator-token-with-at-least-32-characters"


def sample_payload():
    return {
        "id": "api-integration-001",
        "title": "Review reliability finding",
        "summary": "An exception handler may be swallowing an error.",
        "category": "reliability",
        "evidence": [
            {
                "description": "Empty catch block detected.",
                "path": "backend/src/example.js",
                "startLine": 42,
                "endLine": 44,
            }
        ],
    }


def test_health_is_available_without_token():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["executionEnabled"] is False


def test_analyze_requires_service_token():
    response = client.post("/v1/analyze", json=sample_payload())
    assert response.status_code == 401


def test_analyze_returns_safe_graph_result(monkeypatch):
    monkeypatch.setenv("AGENTS_ORCHESTRATOR_TOKEN", TOKEN)
    response = client.post(
        "/v1/analyze",
        json=sample_payload(),
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["task_id"] == "api-integration-001"
    assert body["agent_trace"] == ["scout", "architect", "planner"]
    assert body["human_approval_required"] is True
    assert body["execution_enabled"] is False
