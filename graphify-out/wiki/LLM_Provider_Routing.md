# LLM Provider Routing

> 38 nodes · cohesion 0.08

## Key Concepts

- **chat.ts** (74 connections) — `src/routes/api/chat.ts`
- **embedOne()** (20 connections) — `src/lib/rag/embed.server.ts`
- **provider-route.ts** (12 connections) — `src/lib/ai/provider-route.ts`
- **splitModelId()** (9 connections) — `src/lib/ai/provider-route.ts`
- **providerRoute** (7 connections) — `src/lib/ai/provider-route.ts`
- **provider-route.test.ts** (6 connections) — `src/lib/ai/provider-route.test.ts`
- **findings.server.ts** (6 connections) — `src/lib/rag/findings.server.ts`
- **indexFinding()** (5 connections) — `src/lib/rag/findings.server.ts`
- **providerStyle()** (4 connections) — `src/lib/ai/provider-route.ts`
- **normalizeChatCompletionsUrl()** (3 connections) — `src/lib/ai/provider-route.ts`
- **byoOnlyProvider()** (3 connections) — `src/routes/api/chat.ts`
- **isAnthropicStyle()** (2 connections) — `src/lib/ai/provider-route.ts`
- **isKnownProvider()** (2 connections) — `src/lib/ai/provider-route.ts`
- **findConflictingMemory()** (2 connections) — `src/lib/memory-candidates.functions.ts`
- **sha256()** (2 connections) — `src/lib/rag/findings.server.ts`
- **asWorkShape()** (2 connections) — `src/routes/api/chat.ts`
- **GATEWAY_PROVIDERS** (2 connections) — `src/routes/api/chat.ts`
- **WORK_SHAPES** (2 connections) — `src/routes/api/chat.ts`
- **CompletionStyle** (1 connections) — `src/lib/ai/provider-route.ts`
- **KNOWN_PROVIDER_IDS** (1 connections) — `src/lib/ai/provider-route.ts`
- **KNOWN_PROVIDERS** (1 connections) — `src/lib/ai/provider-route.ts`
- **byoKeyMissingMessage()** (1 connections) — `src/routes/api/chat.ts`
- **ChatMeta** (1 connections) — `src/routes/api/chat.ts`
- **ChatMsg** (1 connections) — `src/routes/api/chat.ts`
- **getSseHeaders()** (1 connections) — `src/routes/api/chat.ts`
- *... and 13 more nodes in this community*

## Relationships

- [Model Cache Management](Model_Cache_Management.md) (12 shared connections)
- [Agent Routing Intent](Agent_Routing_Intent.md) (7 shared connections)
- [Contradiction History Critic](Contradiction_History_Critic.md) (5 shared connections)
- [Agent Loop Functions](Agent_Loop_Functions.md) (4 shared connections)
- [Research and RAG Services](Research_and_RAG_Services.md) (4 shared connections)
- [Ask Block Logic](Ask_Block_Logic.md) (4 shared connections)
- [Memory Recall System](Memory_Recall_System.md) (3 shared connections)
- [Entity Embedding Service](Entity_Embedding_Service.md) (3 shared connections)
- [Audit Tagging and Formatting](Audit_Tagging_and_Formatting.md) (3 shared connections)
- [Memory Review Queue](Memory_Review_Queue.md) (2 shared connections)
- [Decision Supersession Logic](Decision_Supersession_Logic.md) (2 shared connections)
- [Theme Clustering Server](Theme_Clustering_Server.md) (2 shared connections)

## Source Files

- `src/lib/ai/provider-route.test.ts`
- `src/lib/ai/provider-route.ts`
- `src/lib/memory-candidates.functions.ts`
- `src/lib/rag/embed.server.ts`
- `src/lib/rag/findings.server.ts`
- `src/routes/api/chat.ts`

## Audit Trail

- EXTRACTED: 183 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*