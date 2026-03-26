# Market

A competitor analysis tool powered by AI. Enter a company, product, or market idea to instantly discover and understand the competitive landscape.

## Features

- **Smart input classification** - Automatically detects if you're entering a company name, product category, or abstract idea
- **Scope refinement** - Prompts for clarification when inputs are broad (e.g., "Google" → which product line?)
- **Two-phase analysis** - Discovers competitors first, then explains each one in detail
- **Transparency** - View the exact AI prompts and responses in the trace panel

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file:

```
OPENAI_API_KEY=sk-your-api-key-here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js 16](https://nextjs.org/) with App Router
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [OpenAI API](https://platform.openai.com/) (GPT-4o)
- [shadcn/ui](https://ui.shadcn.com/) components
- [Zod](https://zod.dev/) for validation

## License

MIT
