---
name: rag-pipeline-builder
description: Designs and builds production-grade Retrieval-Augmented Generation (RAG) pipelines, covering document parsing, semantic chunking, hybrid retrieval, re-ranking, and grounded generation.
triggers:
  - "rag pipeline"
  - "retrieval augmented generation"
  - "semantic chunking"
  - "hybrid retrieval"
  - "reranking"
  - "vector search"
  - "grounded generation"
  - "rag evaluation"
---

# RAG Pipeline Builder Skill

## Overview
This skill provides complete architectural and implementation guidance for building enterprise Retrieval-Augmented Generation (RAG) systems. A robust RAG pipeline bridges private domain knowledge with foundation models, ensuring verifiable citations, minimal hallucinations, and low latency.

---

## When to Activate This Skill
Activate this skill whenever:
- LLMs need access to proprietary, dynamic, or private enterprise documents (PDFs, Markdown, Confluence, Notion, Codebases).
- Reducing factual hallucinations by grounding responses strictly on authoritative reference passages.
- Building domain question-answering systems, semantic search engines, or document-grounded research assistants.
- Evaluating retrieval quality (Recall@K, MRR) and generation groundedness (Faithfulness, Citation precision).

---

## The End-to-End RAG Architecture

```text
[Document Ingestion]
         │
         ▼
[Parsing & Cleaning] (PDF, HTML, MD, DOCX)
         │
         ▼
[Chunking Strategy] (Semantic / Recursive / Hierarchical)
         │
         ▼
[Embedding Generation] (e.g., text-embedding-004)
         │
         ▼
[Vector / Hybrid DB Indexing] (Dense + Sparse Inverted Index)
         │
═════════╪══════════════════════════════════════════════════════ [Query Time]
         ▼
[User Query] ──► [Query Transformation / Hypothetical Document (HyDE)]
         │
         ▼
[Hybrid Retrieval] (Dense Cosine Similarity + BM25 Sparse Search)
         │
         ▼
[Re-ranking] (Cross-Encoder / Cohere / BGE Re-ranker)
         │
         ▼
[Context Assembly & Prompt Synthesis] (With precise source attribution)
         │
         ▼
[Grounded Generation] (Gemini 2.5 with streaming & citation tags)
```

---

## 1. Chunking Strategies

Choosing the right chunking strategy directly determines retrieval precision:

| Chunking Strategy | Mechanism | Best Use Case | Downsides |
|---|---|---|---|
| **Fixed-Size (Sliding Window)** | Fixed token/character count (e.g. 500 chars) with 10–20% overlap. | Quick prototypes, uniform text. | Splits sentences mid-thought, destroys semantic coherence. |
| **Recursive Character** | Recursively splits along `\n\n`, `\n`, `.`, ` ` boundaries until chunk size target is met. | General prose, technical articles, reports. | May group unrelated adjacent paragraphs. |
| **Document-Aware (Structural)** | Splits along Markdown headers (`#`, `##`), HTML tags, or JSON keys. | Documentation, structured specs, API reference docs. | Chunk sizes vary widely based on document layout. |
| **Semantic Chunking** | Measures cosine similarity between consecutive sentence embeddings; splits when similarity drops below threshold. | Research papers, dense analytical texts, narrative transcripts. | Computationally intensive during ingestion. |
| **Hierarchical (Parent-Child)** | Large parent chunks (1000 tokens) mapped to small child chunks (200 tokens). Searches children, feeds parents to LLM. | Deep technical documentation where local keywords require broad surrounding context. | More storage and complex database relations. |

---

## 2. Embedding Model Selection

| Model | Dimensions | Context Window | Characteristics |
|---|---|---|---|
| **Google text-embedding-004** | 768 (supports MRL truncation) | 2,048 tokens | High efficiency, top MTEB benchmarks, native Google GenAI SDK integration. |
| **OpenAI text-embedding-3-large** | 3072 (truncatable) | 8,191 tokens | High multilingual capacity, widely supported ecosystem. |
| **BAAI/bge-large-en-v1.5** | 1024 | 512 tokens | Open-source, local hosting via Hugging Face/Ollama, zero cloud cost. |

---

## 3. Vector Database Comparison

| Database | Deployment | Strengths | Best Scenario |
|---|---|---|---|
| **pgvector (PostgreSQL)** | Self-hosted / Managed (RDS/Supabase) | Unified SQL transactions, relational metadata filters, ACID compliance. | Existing PostgreSQL stack, relational joins needed. |
| **Chroma** | Local embedded / In-memory / Docker | Zero-configuration, featherweight local development, Python-native. | Prototyping, local CLI agents, unit tests. |
| **Pinecone** | Fully managed Cloud | High scale, zero ops, ultra-low latency, serverless pricing. | Enterprise cloud workloads, high concurrency. |
| **Qdrant** | Self-hosted (Rust) / Cloud | High performance, rich payload filtering, geo-distributed clustering. | High-throughput production, hybrid search. |

---

## 4. Advanced Retrieval & Re-ranking

Dense vector search alone often struggles with exact SKU numbers, acronyms, or rare terms. Hybrid search combines dense and sparse retrieval:

### Hybrid Search Formula: Reciprocal Rank Fusion (RRF)
$$RRF\_Score(d) = \sum_{m \in M} \frac{1}{k + rank_m(d)}$$
Where $k = 60$, and $M = \{\text{Dense Retrieval}, \text{BM25 Sparse Retrieval}\}$.

### Cross-Encoder Re-ranking
Bi-encoders compute vector embeddings independently ($O(N)$). Cross-encoders process `[Query, Document]` jointly through all self-attention layers ($O(N \cdot L)$), producing superior relevance scores:
1. Retrieve Top-50 candidates using fast Hybrid Search.
2. Re-rank the Top-50 down to Top-5 using a cross-encoder model.
3. Feed the refined Top-5 into the LLM context window.

---

## 5. End-to-End Implementation with google-genai

```python
import os
from typing import List, Dict
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Step 1: Embedding helper
def generate_embeddings(texts: List[str]) -> List[List[float]]:
    response = client.models.embed_content(
        model="text-embedding-004",
        contents=texts,
    )
    return [e.values for e in response.embeddings]

# Step 2: Context Formatter with strict citation markers
def format_context_for_prompt(retrieved_docs: List[Dict[str, str]]) -> str:
    formatted_chunks = []
    for idx, doc in enumerate(retrieved_docs, start=1):
        formatted_chunks.append(
            f"[[SOURCE {idx} - ID: {doc.get('id', 'N/A')} | Source: {doc.get('source', 'Unknown')}]]\n"
            f"{doc.get('text', '').strip()}\n"
        )
    return "\n".join(formatted_chunks)

# Step 3: Grounded Answer Generation
def generate_rag_answer(query: str, retrieved_docs: List[Dict[str, str]]) -> str:
    context_text = format_context_for_prompt(retrieved_docs)
    
    system_instruction = (
        "You are an expert technical assistant delivering strictly grounded answers.\n"
        "RULES:\n"
        "1. Rely ONLY on the information provided in the SOURCES section below.\n"
        "2. For every assertion you make, cite the source using brackets like [[SOURCE 1]].\n"
        "3. If the provided sources do not contain sufficient evidence to answer, state:\n"
        "   'Based on the available documentation, there is insufficient information to answer this query.'\n"
        "4. Never invent facts or extrapolate beyond direct citations."
    )

    user_content = f"SOURCES:\n{context_text}\n\nUSER QUESTION:\n{query}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_content,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.1
        )
    )
    return response.text
```

---

## 6. Production RAG Patterns

- **Semantic Cache**: Store `hash(query_embedding)` in Redis. If a new query has $>0.96$ cosine similarity to a cached query, return cached response instantly (sub-50ms latency, zero LLM cost).
- **Streaming Citations**: Stream tokens to user while attaching metadata references upon response completion.
- **Hypothetical Document Embeddings (HyDE)**: For ambiguous queries, ask LLM to generate a hypothetical ideal answer, embed that answer, and use its embedding to search the vector index.

---

## 7. Evaluation Framework (RAG Triad)

| Metric | Target | Definition |
|---|---|---|
| **Context Relevance** | $>0.85$ | Are the retrieved chunks relevant to the user query? (Eliminates noise). |
| **Groundedness (Faithfulness)** | $>0.95$ | Is every claim in the generated response directly supported by the retrieved context? |
| **Answer Relevance** | $>0.90$ | Does the response directly address the user's initial question? |
