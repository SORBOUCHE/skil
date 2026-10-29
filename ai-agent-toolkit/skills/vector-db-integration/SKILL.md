---
name: vector-db-integration
description: Guides configuration, schema design, batch upserts, and filtered vector retrieval across Chroma, pgvector, Pinecone, and Qdrant.
triggers:
  - "vector database"
  - "chroma"
  - "pgvector"
  - "pinecone"
  - "qdrant"
  - "similarity search"
  - "vector index"
  - "embedding storage"
---

# Vector DB Integration Skill

## Overview
This skill provides comprehensive setup, schema design, and operational patterns for connecting AI applications to vector databases. It covers local development with Chroma, enterprise relational integration with pgvector, serverless cloud scaling with Pinecone, and ultra-high throughput indexing with Qdrant.

---

## When to Activate This Skill
Activate this skill whenever:
- Initializing or architecting vector persistence layers for agents or RAG pipelines.
- Choosing the right vector database based on infrastructure, cost, and compliance requirements.
- Designing metadata schemas for complex filtering (e.g., tenant isolation, date ranges, access controls).
- Executing high-throughput batch upserts without exhausting API rate limits or database memory.
- Optimizing vector indexes (HNSW vs IVFFlat, metric distances like Cosine, Euclidean, Dot Product).

---

## 1. Engine Setup & Integration Guides

### A. Chroma (Local Development & Embedded)
Best for rapid prototyping, CI testing, and embedded desktop agents.

```bash
pip install chromadb
```

```python
import chromadb
from chromadb.config import Settings

# Persistent local directory client
client = chromadb.PersistentClient(path="./chroma_data")

# Create or retrieve collection with cosine distance
collection = client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"}
)

# Batch upsert
collection.upsert(
    ids=["doc_1", "doc_2"],
    embeddings=[[0.12, 0.45, -0.23], [0.88, -0.11, 0.05]], # Dimensionality matching embedding model
    metadatas=[
        {"source": "user_guide.pdf", "tenant_id": "tenant_a", "page": 1},
        {"source": "api_spec.md", "tenant_id": "tenant_b", "page": 4}
    ],
    documents=["How to configure OAuth2 tokens", "REST endpoint schema definition"]
)

# Similarity query with metadata filtering
results = collection.query(
    query_embeddings=[[0.10, 0.40, -0.20]],
    n_results=5,
    where={"tenant_id": "tenant_a"}
)
```

---

### B. pgvector (PostgreSQL Integration)
Best for unified database architectures, transactional consistency (ACID), and relational joins.

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table definition with 768-dim embeddings (e.g., text-embedding-004)
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    document_source VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for sub-millisecond approximate nearest neighbor search
CREATE INDEX idx_doc_embeddings_hnsw 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

```python
import psycopg2
from pgvector.psycopg2 import register_vector

conn = psycopg2.connect("dbname=enterprise_ai user=postgres password=secret host=localhost")
register_vector(conn)

with conn.cursor() as cur:
    query_vector = [0.05] * 768
    cur.execute("""
        SELECT id, content, document_source, 1 - (embedding <=> %s) AS cosine_similarity
        FROM document_embeddings
        WHERE tenant_id = %s
        ORDER BY embedding <=> %s
        LIMIT 5;
    """, (query_vector, "tenant_corp", query_vector))
    rows = cur.fetchall()
```

---

### C. Pinecone (Serverless Cloud Vector DB)
Best for zero-ops, managed multi-region enterprise deployments with automatic scaling.

```bash
pip install pinecone-client
```

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="PINECONE_API_KEY")

index_name = "agent-knowledge-base"

# Create serverless index if not existing
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

index = pc.Index(index_name)

# Upsert vectors with metadata
vectors_to_upsert = [
    {
        "id": "item_101",
        "values": [0.012] * 768,
        "metadata": {"category": "cloud", "security_clearance": "confidential"}
    }
]
index.upsert(vectors=vectors_to_upsert, namespace="production")

# Query with filter
query_response = index.query(
    vector=[0.012] * 768,
    top_k=5,
    namespace="production",
    include_metadata=True,
    filter={"category": {"$eq": "cloud"}}
)
```

---

### D. Qdrant (High-Performance Self-Hosted / Cloud)
Best for complex boolean filters, payload storage, and blazing Rust performance.

```bash
pip install qdrant-client
```

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

client = QdrantClient(host="localhost", port=6333)

client.recreate_collection(
    collection_name="agent_memory",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

# Insert points
client.upsert(
    collection_name="agent_memory",
    points=[
        PointStruct(
            id=1,
            vector=[0.05] * 768,
            payload={"role": "assistant", "session_id": "session_99", "topic": "auth"}
        )
    ]
)

# Search with structured boolean filter
search_result = client.search(
    collection_name="agent_memory",
    query_vector=[0.05] * 768,
    limit=5,
    query_filter=Filter(
        must=[
            FieldCondition(key="session_id", match=MatchValue(value="session_99"))
        ]
    )
)
```

---

## 2. High-Throughput Batch Upsert Patterns

When indexing thousands of documents, avoid single-record network calls. Use chunked batching with backoff:

```python
def chunked_iterable(iterable, chunk_size=100):
    for i in range(0, len(iterable), chunk_size):
        yield iterable[i:i + chunk_size]

def batch_upsert_safely(vector_index, items, chunk_size=100):
    import time
    for chunk in chunked_iterable(items, chunk_size):
        retries = 3
        while retries > 0:
            try:
                vector_index.upsert(chunk)
                break
            except Exception as e:
                retries -= 1
                if retries == 0:
                    raise e
                time.sleep(2 ** (3 - retries))
```

---

## 3. Schema Design Patterns by Domain

### 1. Document / Enterprise Knowledge Schema
- `id`: Deterministic hash (`sha256(file_path + chunk_index)`)
- `vector`: Float array (768 or 1536 dim)
- `payload / metadata`:
  - `tenant_id`: string (for multi-tenant isolation)
  - `document_name`: string
  - `file_path`: string
  - `chunk_index`: int
  - `total_chunks`: int
  - `last_modified`: timestamp
  - `content_snippet`: string (first 200 chars for preview)

### 2. Product Catalog Schema
- `id`: SKU code
- `vector`: Joint text + image multimodal embedding
- `payload / metadata`:
  - `category`: string
  - `price_usd`: float (allows range filter `price <= 100`)
  - `in_stock`: boolean
  - `brand`: string
  - `ratings_avg`: float

### 3. Codebase Search Schema
- `id`: `git_commit_sha + filepath + symbol_name`
- `vector`: Code embedding (e.g., CodeBERT / Gemini embedding)
- `payload / metadata`:
  - `repo_name`: string
  - `language`: string (python, typescript, go)
  - `file_path`: string
  - `symbol_type`: enum (class, function, method, interface)
  - `line_start`: int
  - `line_end`: int

### 4. Conversation / Agent Episodic Memory Schema
- `id`: Turn UUID
- `vector`: Embedding of user goal + agent reasoning summary
- `payload / metadata`:
  - `user_id`: string
  - `session_id`: string
  - `timestamp`: int (epoch seconds)
  - `sentiment`: string
  - `status`: enum (resolved, escalated, abandoned)
