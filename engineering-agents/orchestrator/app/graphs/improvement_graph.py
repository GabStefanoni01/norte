from langgraph.graph import END, START, StateGraph

from app.graphs.nodes import architect_node, planner_node, scout_node
from app.graphs.state import ImprovementState


def build_improvement_graph():
    """Build the safe analysis graph: Scout -> Architect -> Planner."""
    graph = StateGraph(ImprovementState)
    graph.add_node("scout", scout_node)
    graph.add_node("architect", architect_node)
    graph.add_node("planner", planner_node)

    graph.add_edge(START, "scout")
    graph.add_edge("scout", "architect")
    graph.add_edge("architect", "planner")
    graph.add_edge("planner", END)

    return graph.compile()
