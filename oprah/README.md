# Oprah Demo

Restored from a Markdown source export for the Airacle team.

## Current launch mode

The public demo is now wired to a server-side LLM proxy on Cloudflare Pages Functions:

- Browser code calls `/api/llm`; LLM keys never go into frontend env or bundles.
- `/api/llm` uses TokenRouter / PaleBlueDot-compatible OpenAI chat completions with `TOKENROUTER_API_KEY` or `PBD_API_KEY` configured as a Pages secret.
- Supabase is optional. If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not provided, the app uses browser `localStorage` so the demo is playable without database setup.
- `VITE_FORCE_MOCK=1` can still force the older local mock responses for offline demos.

## Local dev

```bash
npm install
npm run dev
```

For local Pages Function testing, create a non-committed `.dev.vars`:

```bash
TOKENROUTER_API_KEY=sk-...
LLM_CHAT_MODEL=anthropic/claude-haiku-4.5
LLM_JSON_MODEL=anthropic/claude-haiku-4.5
```

Then:

```bash
npm run build
npx wrangler pages dev dist
```

## Production TODO

1. Configure real Supabase schema / RLS policies for `users` and `collisions`.
2. Add auth / rate limiting around `/api/llm` before opening to broader traffic.
3. Consider using a stronger JSON model for final analysis/collision once cost/latency is acceptable.
4. Rotate any API key that was shared in chat or logs.
