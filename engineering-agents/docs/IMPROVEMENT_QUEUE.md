# Proactive improvement queue

## Discovery cadence

Discovery runs on a schedule and after selected repository events. It starts read-only and records candidates; it does not immediately implement every candidate. A deduplication key should combine normalized title/category with affected paths and evidence.

## Candidate scoring

Use an explainable score with normalized inputs, initially:

`priority = 100 * impact * confidence * urgency / (effort * risk)`

Normalize and clamp the result to 0–100. Store the component values and explanation alongside the score. The score is a ranking heuristic, not an objective truth. Security-critical findings may enter a protected urgent lane only when supported by concrete evidence and should still pass review.

## Queue rules

- Deduplicate equivalent findings and link recurring evidence to the existing task.
- Do not repeatedly reopen dismissed items unless new evidence appears.
- Limit concurrent tasks and active branches.
- Prefer small, reversible, testable changes.
- Keep tasks with unclear evidence in `triaged` or `blocked`; do not implement speculative findings.
- Avoid conflicting tasks that touch the same files until one completes.
- Discovery is proactive, but execution is bounded by an explicit schedule and budget.
- Publish a task only when the implementation, independent review, and validation stages are complete; all PRs wait for human approval.

## Initial default limits (configurable)

- One active implementation per repository.
- Maximum two automated correction attempts after review.
- Maximum one retry per transient infrastructure step, then fail/blocked.
- Per-task time and model-call budgets are mandatory.
- No automatic merge or deployment.