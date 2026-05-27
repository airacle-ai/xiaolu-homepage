type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface Env {
  TOKENROUTER_API_KEY?: string
  PBD_API_KEY?: string
  LLM_MODEL?: string
  LLM_CHAT_MODEL?: string
  LLM_JSON_MODEL?: string
  OPRAH_API_KEY?: string
  RATE_LIMIT_KV?: KVNamespace
}

const BODY_SIZE_LIMIT = 65536

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  })
}

function extractJsonObject(text: string): unknown {
  let s = text.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()

  const start = s.indexOf('{')
  if (start === -1) throw new Error('No JSON object found')

  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return JSON.parse(s.slice(start, i + 1))
    }
  }
  throw new Error('Unterminated JSON object')
}

async function callTokenRouter(env: Env, body: Record<string, unknown>) {
  const apiKey = env.TOKENROUTER_API_KEY || env.PBD_API_KEY
  if (!apiKey) {
    const err = new Error('TOKENROUTER_API_KEY is not configured') as Error & { code: string }
    err.code = 'NO_LLM_KEY'
    throw err
  }

  const response = await fetch('https://api.tokenrouter.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  if (!response.ok) {
    const err = new Error(`TokenRouter ${response.status}: ${text.slice(0, 1000)}`) as Error & { code: string }
    err.code = 'LLM_ERROR'
    throw err
  }

  const data = JSON.parse(text)
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    const err = new Error('LLM returned empty content') as Error & { code: string }
    err.code = 'EMPTY_RESPONSE'
    throw err
  }
  return content
}

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
): Promise<{ limited: boolean }> {
  const key = `rl:${ip}`
  const now = Date.now()
  const windowMs = 60_000
  const maxRequests = 30

  const raw = await kv.get(key)
  let record: { count: number; reset: number } = { count: 0, reset: now + windowMs }

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count: number; reset: number }
      if (parsed.reset > now) {
        record = parsed
      }
      // else window has expired — start fresh
    } catch {
      // corrupt value — start fresh
    }
  }

  record.count += 1

  const ttlSeconds = Math.ceil((record.reset - now) / 1000)
  await kv.put(key, JSON.stringify(record), { expirationTtl: Math.max(ttlSeconds, 1) })

  return { limited: record.count > maxRequests }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // ── 1. Body size limit (Content-Length fast path) ───────────────────────
    const contentLength = request.headers.get('content-length')
    if (contentLength !== null && parseInt(contentLength, 10) > BODY_SIZE_LIMIT) {
      return json(
        { error: 'Request body too large', code: 'BODY_TOO_LARGE', recoverable: false },
        { status: 413 },
      )
    }

    // ── 2. API key auth ──────────────────────────────────────────────────────
    if (env.OPRAH_API_KEY) {
      const origin = request.headers.get('origin') ?? ''
      const requestHost = new URL(request.url).host
      const isSameOrigin =
        origin.startsWith('https://') && new URL(origin).host === requestHost

      if (!isSameOrigin) {
        const authHeader = request.headers.get('authorization') ?? ''
        const bearerToken = authHeader.startsWith('Bearer ')
          ? authHeader.slice('Bearer '.length)
          : ''
        if (bearerToken !== env.OPRAH_API_KEY) {
          return json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED', recoverable: false },
            { status: 401 },
          )
        }
      }
    }

    // ── 3. Rate limiting ─────────────────────────────────────────────────────
    if (env.RATE_LIMIT_KV) {
      const ip =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        'unknown'
      const { limited } = await checkRateLimit(env.RATE_LIMIT_KV, ip)
      if (limited) {
        return json(
          { error: 'Too many requests, please wait.', code: 'RATE_LIMITED', recoverable: true },
          { status: 429, headers: { 'Retry-After': '60' } },
        )
      }
    }

    // ── 4. Read & size-check body text ───────────────────────────────────────
    const bodyText = await request.text()
    if (bodyText.length > BODY_SIZE_LIMIT) {
      return json(
        { error: 'Request body too large', code: 'BODY_TOO_LARGE', recoverable: false },
        { status: 413 },
      )
    }

    // ── 5. Parse JSON ────────────────────────────────────────────────────────
    const payload = JSON.parse(bodyText) as {
      mode?: 'chat' | 'json'
      messages?: ChatMessage[]
      prompt?: string
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      model?: string
    }

    const mode = payload.mode || 'chat'
    const model =
      payload.model ||
      (mode === 'json' ? env.LLM_JSON_MODEL : env.LLM_CHAT_MODEL) ||
      env.LLM_MODEL ||
      (mode === 'json' ? 'anthropic/claude-sonnet-4.6' : 'anthropic/claude-haiku-4.5')
    const maxTokens = payload.maxTokens || (mode === 'json' ? 12000 : 1200)
    const temperature = payload.temperature ?? (mode === 'json' ? 0.2 : 0.8)

    const baseMessages: ChatMessage[] = payload.prompt
      ? [{ role: 'user', content: payload.prompt }]
      : payload.messages || []
    const messages: ChatMessage[] = [
      ...(payload.systemPrompt
        ? [{ role: 'system' as const, content: payload.systemPrompt }]
        : []),
      ...baseMessages,
    ]

    if (messages.length === 0) {
      return json(
        { error: 'messages or prompt required', code: 'BAD_REQUEST', recoverable: false },
        { status: 400 },
      )
    }

    // ── 6. Call LLM ──────────────────────────────────────────────────────────
    const content = await callTokenRouter(env, {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(mode === 'json' ? { response_format: { type: 'json_object' } } : {}),
    })

    // ── 7. Mode-specific response ────────────────────────────────────────────
    if (mode === 'json') {
      let parsed: unknown
      try {
        parsed = extractJsonObject(content)
      } catch {
        return json(
          { error: 'Failed to extract JSON from LLM response', code: 'JSON_PARSE_ERROR', recoverable: true, raw: content },
          { status: 502 },
        )
      }

      if (
        parsed === null ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        return json(
          { error: 'LLM response was not a JSON object', code: 'JSON_SCHEMA_ERROR', recoverable: true, raw: content },
          { status: 502 },
        )
      }

      return json({ result: parsed, raw: content })
    }

    return json({ text: content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    const code =
      (error as { code?: string }).code ||
      'INTERNAL_ERROR'
    const recoverable =
      code === 'NO_LLM_KEY' || code === 'BAD_REQUEST'
        ? false
        : true
    return json({ error: message, code, recoverable }, { status: 500 })
  }
}
