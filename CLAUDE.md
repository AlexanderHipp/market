# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Market is a minimal competitor analysis tool. Enter a company, product, or market idea → get a market frame and list of competitors.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

```
src/
├── app/
│   ├── api/analyze/route.ts   # POST endpoint, calls OpenAI
│   ├── page.tsx               # Single-page UI (input → results)
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Tailwind styles
└── lib/
    └── openai.ts              # Single prompt, returns market + competitors
```

**Flow:** User input → `/api/analyze` → GPT-4o → JSON response → render

## Environment Variables

```
OPENAI_API_KEY=sk-...
```

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- OpenAI SDK (gpt-4o)
