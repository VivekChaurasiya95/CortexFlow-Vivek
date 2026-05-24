# CortexFlow MVP — Modified Implementation Plan

## 1. Product Vision

CortexFlow is a **context-to-strategy intelligence system**, not a chatbot. It takes a user idea, enriches it with retrieved knowledge, routes it through a small set of specialist agents, and returns structured product insights that help turn ideas into strategy [web:45][web:42].

The product should feel simple on the outside and intelligent under the hood. The UI stays clean, while the system uses retrieval, guided questions, agent reasoning, and caching to produce transparent and personalized output [web:47][web:42].

## 2. Core Goal

The MVP goal is to convert an idea into:
- Research insights.
- Market opportunities.
- Risks and failure patterns.
- MVP strategy and roadmap.

The key differentiator is transparency: each internal agent has a distinct responsibility, so the result is easier to inspect, explain, and trust [web:42][web:45].

## 3. High-Level Pipeline

User Input  
↓  
Guided Questions Layer  
↓  
RAG Retriever  
↓  
Context Builder  
↓  
Agent Pipeline  
↓  
Structured Output  
↓  
UI Rendering

The guided question layer sits before the core reasoning so the system can personalize results without exposing internal complexity in the interface [web:47][web:44].

## 4. UX Principle

The UI should use **progressive disclosure**. Show only the minimum needed first, then ask 2–4 short follow-up questions that improve personalization and result quality [web:47][web:25].

This means:
- The agent system stays hidden from the user.
- The UI does not look noisy.
- The app feels like it is “understanding” the idea before analyzing it [web:47][web:44].

Example questions:
- Who is this for?
- What problem are you solving?
- Do you want a consumer, SaaS, or internal tool?
- What timeline are you targeting?

## 5. Minimal Tech Stack

### Frontend
- Next.js / React.
- Tailwind optional.
- Single-page flow with input, questions, and result sections.

### Backend
- Node.js / Express or FastAPI.
- Start simple and keep orchestration in application code.

### AI
- OpenAI or Gemini.

### RAG
- In-memory vectors for MVP.
- Chroma only if persistence becomes necessary.

### Cache / Memory
- Redis for semantic caching, session context, and intermediate agent output reuse [web:43][web:46][web:49].

## 6. Project Structure

```text
/project
 ├── frontend/
 │    ├── App.js
 │    └── components/
 │
 ├── backend/
 │    ├── server.js
 │    ├── rag.js
 │    ├── contextBuilder.js
 │    ├── agents.js
 │    ├── orchestrator.js
 │    └── cache.js
 │
 └── data/
      └── dataset.json
```

## 7. Dataset Design

Create 20–30 curated entries for the RAG base. Each item should include:
- title.
- description.
- tags.
- problems.
- category.
- source type.
- optional notes.

Include a mix of:
- product ideas.
- user complaints.
- market trends.
- startup failures.
- UX frustrations.
- opportunity signals.

The goal is not scale; it is creating useful context that helps the system reason about product ideas [web:46][web:45].

## 8. RAG Implementation

### Step 1: Embeddings
Convert each dataset entry into a vector representation.

### Step 2: Storage
Store vectors in memory for the MVP. If needed, persist cache/state in Redis and keep retrieval storage light.

### Step 3: Retrieval
Return the top-k most relevant chunks for the user idea and the follow-up answers.

### Step 4: Caching
Before retrieval or agent calls, check Redis for:
- previously seen queries.
- semantically similar prompts.
- repeated context chunks.
- intermediate agent outputs [web:43][web:49].

This reduces load and keeps the system responsive when the same idea or close variants are analyzed again [web:43][web:46].

## 9. Context Builder

The context builder should convert raw retrieved chunks into a structured object.

### Input
- user idea.
- follow-up answers.
- retrieved chunks.

### Output
```js
{
  idea: "...",
  audience: "...",
  product_type: "...",
  timeline: "...",
  similar_products: [...],
  pain_points: [...],
  trends: [...],
  risks: [...],
  opportunities: [...]
}
```

Its job is to normalize and compress context so each agent gets a smaller, cleaner input [web:49][web:42].

## 10. Multi-Agent Design

Use multiple agents for **transparency and specialization**, not for visual complexity. Each agent should have a narrow responsibility and produce a distinct intermediate result that can be logged and audited [web:42][web:45].

### Agent Roles
- Research Agent: identifies similar products, patterns, and references.
- Risk Agent: finds weaknesses, failure modes, and hidden assumptions.
- Market Agent: derives opportunities, gaps, and demand signals.
- Strategy Agent: converts inputs into MVP scope, roadmap, and differentiation.

This structure gives clear traceability across the workflow and makes the final recommendation easier to explain [web:42][web:45].

## 11. Agent Pipeline

### Parallel Step
Run research and risk in parallel.

```js
[research, risk] = await Promise.all([
  researchAgent(context),
  riskAgent(context)
]);
```

### Sequential Step
Run market after research.

```js
market = await marketAgent(research);
```

### Final Step
Run strategy after research, risk, and market.

```js
strategy = await strategyAgent(research, risk, market);
```

The final orchestration remains simple, while the internal steps stay transparent and modular [web:45][web:42].

## 12. Prompt Strategy

Keep prompts short and structured.

### Research Agent
> You are a research analyst. Find similar products and patterns. Use only the provided context. Return concise bullet points.

### Risk Agent
> You are a risk analyst. Find weaknesses, blind spots, and failure risks. Use only the provided context. Return concise bullet points.

### Market Agent
> You are a market analyst. Find gaps, opportunities, and demand signals from the research summary.

### Strategy Agent
> You are a product strategist. Generate MVP scope, roadmap, and differentiation using research, risk, and market inputs.

Short prompts are better for speed, token efficiency, and predictable outputs [web:43][web:46].

## 13. Redis Usage

Redis should sit underneath the reasoning system as a fast memory layer.

### Use Redis for:
- semantic cache of query-to-result mappings.
- cache of retrieved chunks.
- cache of agent outputs.
- session state for the current analysis.
- small “memory” for repeated refinement flows [web:43][web:49].

### Do not use Redis for:
- core reasoning logic.
- prompt generation.
- orchestration rules.

This keeps the architecture clean: the app decides what to do, and Redis helps it avoid redoing work [web:43][web:46].

## 14. Chunking Strategy

Break work into semantically meaningful chunks:
- idea.
- audience.
- problem.
- market.
- risk.
- solution direction.

Do not split randomly. Chunking should preserve meaning so the agents can still reason coherently while processing smaller inputs [web:46][web:49].

## 15. UI Structure

The UI should remain minimal and readable.

### Input Area
- Main textarea: “Enter your idea”.
- Button: “Analyze”.

### Guided Questions
- Show 2–4 questions dynamically based on the idea.
- Keep them short, contextual, and optional when possible.

### Output Sections
- Research Insights.
- Market Opportunities.
- Risks.
- Strategy Plan.
- Sources Used.

The user should see one clean result page, not a dashboard of internal agent activity [web:47][web:44].

## 16. Response Format

Return structured JSON from the backend.

```json
{
  "research": "...",
  "market": "...",
  "risk": "...",
  "strategy": "...",
  "sources": [...],
  "questions": [...]
}
```

If needed, include confidence signals or short rationale fields for transparency.

## 17. Observability and Traceability

Log the following for each run:
- input idea.
- follow-up answers.
- retrieved chunks.
- cache hits/misses.
- each agent’s output.
- final strategy output.

This creates a traceable system path and makes debugging far easier, especially in a multi-agent workflow [web:42][web:45].

## 18. Performance Rules

- Keep prompts short.
- Use a small dataset.
- Parallelize only when useful.
- Cache repeated work.
- Avoid unnecessary chain depth.
- Prefer concise outputs over verbose reasoning.

These constraints are important for a 3-hour MVP and also reduce latency and token cost [web:43][web:49].

## 19. Optional Features

- “Refine Idea” button.
- “Ask one more question” flow.
- Loader text such as:
  - “Research Agent thinking...”
  - “Evaluating risks...”
  - “Building strategy...”
- Basic memory for recent user sessions.
- “Show reasoning summary” toggle for transparency.

These are optional, but they can make the product feel intelligent without cluttering the main UI [web:47][web:44].

## 20. Do Not Do

- No complex agent frameworks.
- No scraping.
- No real external APIs in the MVP.
- No overengineering.
- No visible agent maze in the UI.
- No unnecessary Redis usage beyond caching and memory.

The MVP should stay lean, understandable, and fast [web:42][web:43].

## 21. Demo Script

> CortexFlow uses retrieval-augmented generation and role-specialized agents to transform ideas into structured, evidence-backed product strategies.  
> The UI stays simple, while hidden reasoning and caching power personalized insights under the hood.

## 22. Final Positioning

CortexFlow is:
- a retrieval-backed intelligence system.
- a transparency-first agent workflow.
- a personalized idea-to-strategy engine.
- a simple UI on top of a structured reasoning stack.

That makes it more compelling than a generic chatbot and easier to explain as a product [web:45][web:42][web:47].