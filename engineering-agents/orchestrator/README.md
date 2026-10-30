# Norte Engineering Agents — Python Orchestrator

LangGraph-based orchestration service. The first milestone implements a safe, deterministic analysis graph:

`Scout -> Architect -> Planner`

## Safety boundary

- This milestone does not call an LLM.
- It does not clone, read, execute, or modify repository files.
- It does not create branches, worktrees, commits, or pull requests.
- It never grants execution permission.
- Every generated plan requires human approval.
- Control API remains the authority for task state, approval, leases, and audit events.
- Builder and Reviewer are intentionally not enabled in this milestone.

The graph consumes a task payload shaped from the Control API task contract. The FastAPI service exposes an authenticated `/v1/analyze` endpoint; the Control API calls it and persists the returned reviewable plan. PostgreSQL checkpoint persistence remains a later milestone.

## Requirements

- Python 3.11+
- No Docker required

## Local setup (PowerShell)

```powershell
cd engineering-agents/orchestrator
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
pytest
```

## Run with JSON input

```powershell
@'
{
  "id": "example-task-001",
  "title": "Review a reliability finding",
  "summary": "An exception handler may be swallowing an error.",
  "category": "reliability",
  "evidence": [
    {
      "description": "Empty catch block detected.",
      "path": "backend/src/example.js",
      "startLine": 42,
      "endLine": 44
    }
  ]
}
'@ | python -m app.main
```

The output includes a structured plan and explicitly reports `execution_enabled: false`.

## Next integration steps

1. Define and version the HTTP contract with the existing Control API.
2. Add authenticated task retrieval and result/event ingestion.
3. Add a PostgreSQL checkpointer using a dedicated least-privilege database role/schema.
4. Add a human-approval interrupt that resumes only after Control API independently validates the approved plan hash and execution lease.
5. Implement Builder and Reviewer only after workspace-scoped capabilities and security tests are in place.


## Run the authenticated HTTP service

The service loads `engineering-agents/.env` automatically. Configure `AGENTS_ORCHESTRATOR_TOKEN` there with a random secret of at least 32 characters; the Control API uses the same value.

From the `engineering-agents` directory:

```powershell
npm run orchestrator:serve
```

The service listens on `127.0.0.1:4320`. Its health endpoint is `GET /health`; authenticated analysis is `POST /v1/analyze`. It never reads repository files or executes changes.
