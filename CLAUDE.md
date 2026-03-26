# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Market is a competitor analysis tool that uses OpenAI's GPT-4o to identify and explain competitors for a given company, product, or market idea. Users input a company name or product concept, and the app returns a market summary with detailed competitor profiles.

## Development Commands

```bash
npm run dev      # Start development server (Next.js with Turbopack)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

### Core Flow
1. User enters input (company/product/idea) → `src/lib/classifier.ts` categorizes it
2. If broad input detected, UI prompts for scope refinement
3. `/api/analyze` endpoint calls `src/lib/openai.ts`
4. Two-phase OpenAI calls: discovery (find competitors) → explanation (detail each one)
5. Results displayed with trace panel showing AI prompts/responses

### Key Files
- `src/lib/openai.ts` - OpenAI integration with structured prompts for discovery and explanation
- `src/lib/schemas.ts` - Zod schemas for validating OpenAI JSON responses
- `src/lib/classifier.ts` - Input classification logic (company vs product vs market vs idea)
- `src/lib/known-companies.ts` - Lookup table for known companies with research context
- `src/app/api/analyze/route.ts` - API endpoint orchestrating the analysis

### Component Structure
- `src/components/competitor-card.tsx` - Individual competitor display
- `src/components/trace-panel.tsx` - Debug panel showing AI prompts/responses
- `src/components/ui/` - shadcn/ui primitives

## Environment Variables

Required in `.env.local`:
```
OPENAI_API_KEY=sk-...
```

## Tech Stack
- Next.js 16 with App Router
- React 19
- Tailwind CSS 4 with PostCSS
- OpenAI SDK (gpt-4o model)
- Zod for schema validation
- shadcn/ui components (Radix primitives)
