from typing import Any

from app.graphs.state import ImprovementState


def scout_node(state: ImprovementState) -> dict[str, Any]:
    """Normalize the supplied finding in Brazilian Portuguese."""
    task = state["task"]
    evidence = task.get("evidence", [])
    finding = {
        "task_id": task["id"],
        "title": task["title"],
        "summary": task["summary"],
        "category": task["category"],
        "evidence": evidence,
        "source": "payload-da-control-api",
        "limitations": [
            "Esta versão inicial considera somente as evidências fornecidas pela Control API.",
            "Nenhum arquivo do repositório é lido ou executado nesta etapa.",
        ],
    }
    return {
        "finding": finding,
        "agent_trace": [*state.get("agent_trace", []), "scout"],
    }


def architect_node(state: ImprovementState) -> dict[str, Any]:
    """Produce a bounded architecture assessment in Brazilian Portuguese."""
    finding = state["finding"]
    architecture = {
        "problem_statement": finding["summary"],
        "category": finding["category"],
        "proposed_approach": (
            "Preparar uma proposta de alteração com escopo restrito, baseada nas evidências fornecidas. "
            "Não modificar arquivos-fonte durante a análise."
        ),
        "constraints": [
            "Preservar a arquitetura existente da aplicação e os contratos públicos.",
            "Não acessar segredos nem arquivos de ambiente.",
            "Não modificar as branches main ou develop.",
            "Exigir aprovação humana explícita antes de qualquer implementação.",
        ],
        "unknowns": [
            "O contexto do repositório ainda não foi carregado por uma ferramenta somente de leitura.",
            "A abordagem proposta deverá ser conferida com o código-fonte atual antes da implementação.",
        ],
    }
    return {
        "architecture": architecture,
        "agent_trace": [*state.get("agent_trace", []), "architect"],
    }


def planner_node(state: ImprovementState) -> dict[str, Any]:
    """Create a reviewable plan in Brazilian Portuguese; never grant execution permission."""
    task = state["task"]
    plan = {
        "task_id": task["id"],
        "objective": task["title"],
        "steps": [
            "Inspecionar o código-fonte afetado e os testes relacionados em modo somente leitura.",
            "Conferir a alteração proposta com os padrões do repositório e suas dependências.",
            "Preparar uma implementação mínima em um ambiente de trabalho isolado somente após aprovação.",
            "Executar apenas os comandos de validação explicitamente aprovados.",
        ],
        "files_to_modify": [],
        "risks": [
            "Os arquivos exatos e o escopo da alteração ainda não foram verificados por uma inspeção somente de leitura.",
        ],
        "validation": [
            "Adicionar ou atualizar testes automatizados específicos para a alteração.",
            "Executar a suíte de testes existente e as verificações estáticas relevantes.",
        ],
        "rollback": "Descartar a worktree isolada se a validação falhar; não realizar merge nem push.",
        "humanApprovalRequired": True,
        "executionEnabled": False,
    }
    return {
        "plan": plan,
        "human_approval_required": True,
        "execution_enabled": False,
        "agent_trace": [*state.get("agent_trace", []), "planner"],
    }
