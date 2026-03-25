# Market

A minimal Next.js app that uses the OpenAI API to map a competitive landscape from a short description: market summary, competitor list, and optional trace of prompts and responses for debugging.

## Requirements

- Node.js 20+
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Development server       |
| `npm run build` | Production build       |
| `npm run start` | Run production server  |
| `npm run lint`  | ESLint                 |

## Stack

- [Next.js](https://nextjs.org) (App Router)
- React 19, TypeScript, Tailwind CSS 4
- [OpenAI Node SDK](https://github.com/openai/openai-node)
- [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)

## License

MIT — see [LICENSE](LICENSE).
