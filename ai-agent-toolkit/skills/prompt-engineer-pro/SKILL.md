---
name: prompt-engineer-pro
description: Crafts, benchmarks, and optimizes enterprise-grade system prompts, few-shot examples, reasoning chains (CoT, ToT), and structured schema outputs.
triggers:
  - "prompt engineering"
  - "system prompt"
  - "chain of thought"
  - "tree of thought"
  - "few shot"
  - "structured output"
  - "json schema prompt"
  - "prompt optimization"
---

# Prompt Engineer Pro Skill

## Overview
This skill provides professional prompt engineering methodologies for modern Large Language Models. Moving beyond ad-hoc prompting, this skill treats prompts as production code: versioned, structured, deterministic, and rigorously evaluated.

---

## When to Activate This Skill
Activate this skill whenever:
- Formulating system prompts or instructions for new AI agents or features.
- LLM outputs suffer from hallucinations, non-compliance, format drift, or lack of depth.
- Requiring reliable JSON / schema-validated output from LLM calls.
- Implementing complex reasoning tasks (multi-step logic, mathematical problem solving, compliance checks).
- Building regression test suites and version control systems for prompts.

---

## Anatomy of a Professional System Prompt

A production-ready system prompt follows a modular, hierarchical structure:

```markdown
# 1. Identity & Persona
[Define who the model is, operational scope, tone, domain expertise]

# 2. Primary Objective & Context
[Explicit description of the goal, target audience, and operating constraints]

# 3. Behavioral Rules & Guardrails
[Numbered negative and positive constraints, boundary limits, privacy rules]

# 4. Input Specification
[Detailed description of expected input variables, delimiters, formats]

# 5. Output Specification & Schema
[Exact output contract: JSON schema, Markdown headings, or delimiter tags]

# 6. Reasoning Strategy
[Instructions on whether to use internal scratchpad, step-by-step reasoning]

# 7. Few-Shot Exemplars
[Pairs of diverse (Input -> Thought -> Output) demonstrations]

# 8. Fallback / Edge Case Handling
[Explicit responses for unanswerable queries, ambiguities, or safety violations]
```

---

## Core Prompting Techniques

### 1. Chain-of-Thought (CoT) Prompting
- Instructs the model to output intermediate reasoning steps before delivering the final answer.
- **Formula**: "Think step-by-step. Detail your premises and logical transitions inside `<reasoning>` tags before stating your conclusion."
- Dramatically increases accuracy on arithmetic, symbolic reasoning, and causal inference.

### 2. Tree-of-Thought (ToT) Prompting
- Explores multiple reasoning branches simultaneously, evaluating promising paths and backtracking from dead ends.
- **Workflow**:
  1. Generate 3 distinct initial candidate approaches.
  2. Critique each approach against constraints.
  3. Select the best branch and develop it further.

### 3. Few-Shot In-Context Learning
- Demonstrates desired behavior through 2–5 canonical examples.
- Rules for effective few-shots:
  - Include edge cases (e.g., negative examples or gracefully handled ambiguity).
  - Balance classes in classification tasks to avoid frequency bias.
  - Keep reasoning traces consistent across exemplars.

### 4. Zero-Shot with Explicit Persona & Delimiters
- Used when latency or token budgets prohibit few-shots.
- Employs XML or Markdown delimiters (`### Instruction`, `### Context`, `### Query`) to prevent prompt injection and maintain clear separation of concerns.

---

## Structured Output Design (JSON Schemas)

Modern models (like Gemini 2.5) support native JSON schema enforcement using `response_schema` and `response_mime_type="application/json"`.

### Example: Pydantic Schema with google-genai SDK

```python
import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class RiskAssessment(BaseModel):
    category: str = Field(description="Risk category (e.g., Security, Financial, Operational)")
    severity: str = Field(description="Low, Medium, High, Critical")
    mitigation_strategy: str = Field(description="Concrete recommended action to neutralize risk")

class ArchitectureReview(BaseModel):
    summary: str = Field(description="Executive summary of the architecture")
    strengths: List[str] = Field(description="Key architectural strengths")
    risks: List[RiskAssessment] = Field(description="Enumerated risks and mitigations")
    estimated_readiness_score: int = Field(description="Readiness score from 1 to 100")

def analyze_architecture(spec_text: str) -> ArchitectureReview:
    prompt = f"Perform an exhaustive technical evaluation on the following architecture proposal:\n\n{spec_text}"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are an Enterprise Cloud & AI Architect. Analyze systems for scalability, "
                "fault-tolerance, security, and maintenance overhead."
            ),
            response_mime_type="application/json",
            response_schema=ArchitectureReview,
            temperature=0.1
        )
    )
    return ArchitectureReview.model_validate_json(response.text)
```

---

## Production Prompt Templates by Use Case

### Template 1: Extraction & Entity Normalization
```markdown
You are an expert Information Extraction Engine.
Your task is to parse unstructured text into structured schema records.

RULES:
1. Extract ONLY facts explicitly stated in the input text. Never infer or invent unstated data.
2. If an entity is missing or ambiguous, set its value to null.
3. Normalize dates to ISO-8601 (YYYY-MM-DD).
4. Output strictly valid JSON matching the requested schema.

INPUT TEXT:
{{input_text}}
```

### Template 2: Multi-Criteria Classification
```markdown
You are a Compliance & Security Classifier for cloud workloads.
Evaluate the provided incident description against regulatory policies (SOC2, HIPAA, GDPR).

For each policy:
- State COMPLIANT, NON_COMPLIANT, or NOT_APPLICABLE.
- Cite the relevant sentence in the incident report justifying the decision.
- Provide severity rating [P1, P2, P3, P4].

Input Incident:
{{incident_report}}
```

### Template 3: Complex Reasoning with Chain-of-Thought
```markdown
You are a Principal Software Reliability Engineer analyzing a distributed system failure.

Follow this reasoning process:
1. <symptom_analysis>: List all observable error codes, spikes, and timeline events.
2. <hypothesis_generation>: Formulate at least 3 plausible root causes.
3. <evidence_evaluation>: Contrast each hypothesis against telemetry data.
4. <root_cause_conclusion>: Declare the most probable root cause with confidence level.
5. <remediation_plan>: Provide immediate mitigation and permanent architectural fix.
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Description | Remediation |
|---|---|---|
| **Vague Adjectives** | Using "be smart", "make it good", "be concise". | Define quantitative thresholds: "Limit response to under 150 words" or "Cover 3 concrete items". |
| **Negative Only Rules** | "Don't hallucinate", "Don't mention competitors". | State positive instructions: "Stick strictly to provided context; if absent, state 'Information not found'." |
| **Format Ambiguity** | Asking for "a list or summary or table". | Explicitly mandate one format: "Format as Markdown table with columns: [ID, Feature, Status]". |
| **Delimiter Omission** | Mixing system instructions and user input in one text block. | Wrap user content in triple backticks or `<user_content>...</user_content>` XML tags. |
| **Over-Stuffing Context** | Injecting 50 uncurated documents causing attention dilution. | Pre-filter or re-rank context before prompt injection. |

---

## Prompt Versioning & Iterative Optimization Methodology

```text
Prompt v1.0 ──► Golden Dataset Run ──► Eval Metrics (Accuracy, Schema Drift, Latency)
                       ▲                                  │
                       │                                  ▼
               Refine Prompt <────────── Failure Case Analysis (Categorize Errors)
```

1. **Curate Golden Test Dataset**: Maintain 50–200 representative input cases covering typical inputs, boundary cases, and adversarial prompts.
2. **Define Automated Metrics**:
   - Exact match / Schema adherence (100% required)
   - Semantic similarity / BertScore against ground truth
   - LLM-as-a-Judge grading rubrics
3. **Analyze Failure Clusters**:
   - Hallucination: Tighten grounding constraint.
   - Truncation / Format drop: Switch to native structured outputs.
   - Misinterpretation: Add 1 targeted few-shot exemplar.
4. **Semantic Versioning**: Tag prompts as `v1.0.0`, `v1.1.0` in Git with accompanying benchmark scorecards.
