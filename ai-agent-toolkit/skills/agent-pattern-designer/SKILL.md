---
name: agent-pattern-designer
description: Designs, architects, and implements robust AI agent systems using industry-standard agentic patterns (ReAct, Plan-and-Execute, Multi-Agent Orchestration, Reflexion, Self-Critique).
triggers:
  - "agent design"
  - "multi-agent"
  - "react agent"
  - "plan and execute"
  - "reflexion"
  - "tool calling"
  - "function declaration"
  - "agentic workflow"
---

# Agent Pattern Designer Skill

## Overview
This skill guides the design, selection, and implementation of production-ready agentic architectures. Rather than relying on simple one-shot LLM invocations, modern agent systems execute multi-step workflows, autonomously formulate hypotheses, invoke tools, inspect execution outcomes, evaluate progress, and coordinate across specialized sub-agents.

---

## When to Activate This Skill
Activate this skill whenever:
- Designing autonomous workflows that interact with APIs, databases, or external environments.
- Tasks require sequential planning, dynamic decision branches, or runtime error recovery.
- A single LLM call suffers from high cognitive load or misses key requirements.
- Building multi-agent systems where agents adopt specialized roles (e.g., Planner, Researcher, Critic, Coder).
- Implementing self-healing, verification, or iterative refinement loops for mission-critical outputs.

---

## Core Agentic Design Patterns

### 1. ReAct (Reasoning + Acting)
- **Concept**: Interleaves natural language reasoning traces ("Thought") with concrete environment actions ("Action" -> Tool Call) and observations ("Observation" -> Tool Output).
- **Best For**: Dynamic exploration, interactive environments, API integrations, debugging loops, ad-hoc queries.
- **Trade-offs**: Prone to infinite loops or tool hallucinations if stopping criteria and step limits are not strictly enforced.

### 2. Plan-and-Execute
- **Concept**: Decouples macro-planning from micro-execution. A Planner agent decomposes a complex goal into an explicit DAG or ordered step list. A Worker/Executor agent carries out each step. A Replanner updates the plan when unexpected results occur.
- **Best For**: Deterministic, multi-stage workflows, data pipelines, complex migrations, long-horizon tasks.
- **Trade-offs**: Slightly higher latency on initial setup; replanning overhead when steps fail frequently.

### 3. Multi-Agent Orchestrator (Supervisor / Hierarchical)
- **Concept**: A central orchestrator or state machine delegates sub-tasks to specialized domain agents (e.g., Researcher, SQL Analyst, Synthesizer, Formatter) and manages inter-agent messaging and state aggregation.
- **Best For**: Cross-functional domains, large codebases, parallel research synthesis, enterprise workflows.
- **Trade-offs**: Higher token consumption; state management complexity.

### 4. Reflexion & Self-Critique
- **Concept**: The agent evaluates its candidate output against rubrics, unit tests, or runtime logs, records critique reflections into episodic memory, and re-attempts generation until quality bars are met.
- **Best For**: Code generation, mathematical derivations, strict policy compliance, complex schema formatting.
- **Trade-offs**: Multiplies token usage; requires reliable validation signals (tests, linters, or rubrics).

---

## Pattern Decision Matrix

| Task Characteristics | Recommended Pattern | Fallback / Extension |
|---|---|---|
| Exploratory API queries, uncertain tool responses | **ReAct** | ReAct with Human-in-the-Loop |
| Multi-step structured goals with known milestones | **Plan-and-Execute** | Plan-and-Execute with Replanner |
| Multi-disciplinary, large scope, specialized personas | **Multi-Agent Orchestrator** | Hierarchical Router |
| Code generation, mathematical logic, strict JSON adherence | **Reflexion / Self-Critique** | Test-driven generation loop |
| High-stakes financial/production changes | **Plan-and-Execute + HITL** | Orchestrator with approval gate |

---

## End-to-End Implementation Workflow

```text
[1. Requirement Analysis] -> [2. Pattern Selection] -> [3. Tool Contracts & Declarations]
                                                                    │
[6. Verification & Evals] <- [5. Guardrails & Recovery] <- [4. Memory & Context Architecture]
```

1. **Understand Requirements**: Detail input payload, expected terminal state, latency thresholds, token budget, and security constraints.
2. **Choose Pattern**: Apply the decision matrix based on task horizon and environmental feedback needs.
3. **Define Tool Contracts**: Write explicit JSON schemas / Pydantic models with clear descriptions, parameter types, and validation constraints.
4. **Design Memory Strategy**: Select working memory (short-term chat history), episodic memory (vector store of past executions), and scratchpad state.
5. **Plan Error Handling & Circuit Breakers**: Set maximum loop iterations, retry timeouts, fallbacks for tool outages, and guardrails for destructive actions.
6. **Implement & Test**: Write unit tests, mock tool calls, simulate failure injections, and measure token usage.

---

## Concrete Implementations with google-genai SDK

### 1. ReAct Pattern with Tool Calling

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Define concrete tool implementations
def search_documentation(query: str) -> dict:
    """Searches internal technical documentation for a given query."""
    # Simulated search result
    return {
        "status": "success",
        "query": query,
        "results": [
            "Gemini 2.5 supports native multimodal streaming and function calling.",
            "Function calling requires explicit schema definitions in tools parameter."
        ]
    }

def run_react_agent(user_prompt: str, max_steps: int = 5):
    system_instruction = (
        "You are an autonomous engineering assistant operating under the ReAct paradigm. "
        "For every user request, reason step-by-step ('Thought:'), determine whether an action "
        "is needed ('Action:'), inspect the observation, and formulate your final response when complete."
    )

    tools = [search_documentation]
    
    # Initialize chat session
    chat = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=0.2
        )
    )

    response = chat.send_message(user_prompt)
    steps = 0

    while response.function_calls and steps < max_steps:
        steps += 1
        call = response.function_calls[0]
        print(f"[Step {steps}] Function call invoked: {call.name} with args: {call.args}")

        # Execute matched tool
        if call.name == "search_documentation":
            tool_result = search_documentation(**call.args)
        else:
            tool_result = {"error": f"Unknown function: {call.name}"}

        # Send tool response back into conversation
        response = chat.send_message(
            types.Part.from_function_response(
                name=call.name,
                response={"result": tool_result}
            )
        )

    return response.text
```

### 2. Plan-and-Execute Implementation

```python
import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class ExecutionPlan(BaseModel):
    task: str = Field(description="The primary objective")
    steps: List[str] = Field(description="Ordered list of deterministic execution steps")

def generate_plan(goal: str) -> ExecutionPlan:
    prompt = f"Decompose this complex goal into an ordered list of concrete steps: {goal}"
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExecutionPlan,
            system_instruction="You are a Principal Technical Planner. Break objectives into concise atomic steps."
        )
    )
    return ExecutionPlan.model_validate_json(response.text)

def execute_step(step: str, previous_context: str) -> str:
    prompt = f"Context so far:\n{previous_context}\n\nExecute current step: {step}"
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are an execution specialist. Execute the specified step thoroughly."
        )
    )
    return response.text

def run_plan_and_execute(goal: str) -> str:
    plan = generate_plan(goal)
    print(f"Plan generated with {len(plan.steps)} steps.")
    
    cumulative_context = f"Goal: {goal}\n"
    for idx, step in enumerate(plan.steps, start=1):
        print(f"Executing step {idx}: {step}")
        step_result = execute_step(step, cumulative_context)
        cumulative_context += f"\n--- Step {idx}: {step} ---\n{step_result}\n"

    # Final synthesis
    synthesis = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Summarize the final outcome based on all executed steps:\n{cumulative_context}"
    )
    return synthesis.text
```

### 3. Reflexion & Self-Critique Implementation

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def generate_candidate(task: str, critique_history: list) -> str:
    prompt = f"Task: {task}\n"
    if critique_history:
        prompt += "\nPrevious attempts were critiqued as follows:\n"
        for i, c in enumerate(critique_history, 1):
            prompt += f"Attempt {i} Critique: {c}\n"
        prompt += "\nPlease fix all identified issues and provide an updated solution."

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.3)
    )
    return response.text

def critique_candidate(task: str, solution: str) -> tuple[bool, str]:
    critique_prompt = f"""Task: {task}
Candidate Solution:
{solution}

Evaluate the candidate solution against correctness, efficiency, and edge cases.
Format your response as:
STATUS: [PASS | FAIL]
FEEDBACK: [Detailed critique or confirmation of success]
"""
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=critique_prompt,
        config=types.GenerateContentConfig(temperature=0.0)
    )
    output = response.text
    is_passed = "STATUS: PASS" in output
    return is_passed, output

def run_reflexion_loop(task: str, max_reflections: int = 3) -> str:
    critiques = []
    for attempt in range(max_reflections):
        print(f"[Reflexion] Iteration {attempt + 1}")
        candidate = generate_candidate(task, critiques)
        passed, feedback = critique_candidate(task, candidate)
        if passed:
            print("[Reflexion] Passed self-critique verification!")
            return candidate
        print(f"[Reflexion] Failed verification. Adding feedback to memory.")
        critiques.append(feedback)
    
    # Return best effort after max reflections
    return candidate
```

---

## Multi-Agent Coordination Strategies

1. **Sequential Pipeline (Chain)**:
   - Output of Agent A becomes input to Agent B.
   - Ideal for: `Drafting -> Reviewing -> Formatting`.
2. **Supervisor / Dispatcher (Star Network)**:
   - Central router analyzes user query and assigns execution to specialized worker agents (`DataAnalyst`, `WebResearcher`, `CodeGenerator`), then merges their outputs.
3. **Hierarchical Swarm**:
   - High-level manager creates work packages, delegates to mid-level leads, who direct individual leaf agents.
4. **Debate / Consensus**:
   - Multiple agents with differing system instructions or viewpoints debate a proposal. A Judge agent evaluates arguments and selects the final outcome.

---

## Best Practices & Failure Modes
- **Infinite Looping**: Always bind while-loops to `max_steps <= 10`.
- **Context Poisoning**: Strip verbose tool errors or truncate large API responses before inserting into prompt context.
- **State Serialization**: Save agent conversation states to structured storage (Redis / PostgreSQL) between execution turns for resumption.
- **Idempotency**: Ensure tool functions (especially file updates or API writes) are idempotent or safeguarded with dry-run flags.
