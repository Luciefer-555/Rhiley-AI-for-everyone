# Rhiley — Local AI Frontend Engineer

Rhiley is a self-hosted AI coding assistant that generates production React components from natural language, running entirely on local models via Ollama — no calls to a hosted LLM API for the core generation loop.

## Problem

Most AI coding assistants are thin wrappers around a single hosted model, with no way to specialize, no persistent memory of what you've taught them, and no visibility into how they picked an answer. Rhiley is built to solve a narrower problem well: fast, good React/Tailwind/Framer Motion code generation, running privately, that gets measurably better at specific things over time instead of staying static.

## Multi-Model Routing

Every request is classified before it's sent anywhere:

```
User message → intent classifier
    has image?              → vision role (llava:7b)
    wants to build/code?    → coding role (qwen2.5-coder:7b)
    wants headline/copy?    → copy role (qwen3:8b)
    plain chat?             → general role (qwen3:8b)
```

Classification is keyword/regex-based rather than a routing model call — deliberately cheap, since the routing decision itself shouldn't cost a full inference pass. A separate fast-path intercepts pure social messages ("hey", "thanks") with a canned reply before any model call happens at all, since those don't need a 7B+ model to answer.

Worth being precise about the current model mapping (the "role names" and the actual local models aren't always the same): the vision role runs LLaVA directly, the coding role currently runs Qwen2.5-Coder rather than DeepSeek, and both the general-chat and copywriting roles currently point at the same Qwen3:8B model. Labels are per-role, not a strict one-model-per-brand-name mapping — worth keeping the README honest about that rather than implying four distinct branded models.

## Self-Rewiring Skill System

The most interesting piece: Rhiley can be told to specialize at runtime ("rewire yourself to be world-class at GSAP scroll animations"), and that's not a metaphor for a longer prompt — it's a real stored-state mechanism.

1. A regex pattern set detects rewire intent (`rewire yourself`, `get better at`, `specialize in`, `master how to`, etc.)
2. The coding model is prompted to generate a structured "skill block" as JSON — a name, trigger keywords, a technical system-prompt injection (capped at 800 characters), code patterns, and required libraries
3. The skill is saved into a persistent brain object alongside the model's core identity and coding rules
4. On future requests, up to 3 matching skills (by trigger keyword) get injected into the system prompt — so a taught skill actually changes future generations, not just the current conversation
5. The brain keeps a rollback history of its last 10 states and a rewire log, so a bad skill addition can be undone

## Dataset-Grounded Generation

Code generation is backed by a real scraped dataset rather than model knowledge alone — verified against the repo's own scrape-stats file: 8,017 cumulative examples (7,694 from a GitHub scrape pass), ~35MB combined across multiple structured JSON files (component patterns, color systems, a UI library registry). Relevant snippets are pulled by keyword match and injected into the coding prompt alongside the user's request, rather than relying on the base model's training data for library-specific patterns like Framer Motion variants.

## Image-to-Design Analysis

When an image is attached, the vision model is prompted to return a structured design-analysis block (color palette with hex values, aesthetic label, typography and motion recommendations) alongside normal conversational text — parsed by the frontend into a dedicated UI component rather than left as raw model output.

## Tech Stack

`Next.js 15 (App Router)` `TypeScript` `Tailwind CSS` `Framer Motion` `Sandpack (live in-chat preview)` `Ollama` — local models: LLaVA (vision), Qwen2.5-Coder (code generation), Qwen3 (general chat / copy)

## Status

Built during the AMD Hackathon. Core routing, the skill-rewiring system, and dataset-grounded generation are implemented and running locally. This branch shows early work toward NVIDIA NIM as a cloud-hosted fallback alongside the local Ollama path — not yet wired into the live request path as of this snapshot.

---

*Routing logic, the self-rewiring brain/skill system, and the dataset scraping pipeline are original work.*
