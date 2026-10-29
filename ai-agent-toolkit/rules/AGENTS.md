# AI Agent Toolkit Rules

## 1. Agent Design First
- Before writing code for any AI feature, design the agent architecture first.
- Define: inputs, outputs, tools available, memory strategy, and failure handling.
- Prefer composable, modular agents over monolithic LLM calls.

## 2. Prompt Engineering Standards
- Always provide a clear, detailed System Prompt with:
  - Persona and role definition
  - Explicit task description
  - Output format specification (JSON schema if structured output needed)
  - At least 2 few-shot examples for complex tasks
- Test prompts against edge cases: empty input, adversarial input, ambiguous requests.

## 3. RAG Pipeline Quality
- Chunk documents semantically, not by fixed character count.
- Always include source attribution in retrieved context.
- Implement re-ranking when using dense retrieval.
- Evaluate retrieval quality before connecting to generation.

## 4. Safety & Guardrails
- Every agent must have output validation.
- Multi-agent systems must have a human-in-the-loop checkpoint for consequential actions.
- Never hardcode API keys — use environment variables always.
