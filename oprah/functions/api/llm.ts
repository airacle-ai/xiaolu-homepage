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
}

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
  if (!apiKey) throw new Error('TOKENROUTER_API_KEY is not configured')

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
    throw new Error(`TokenRouter ${response.status}: ${text.slice(0, 1000)}`)
  }

  const data = JSON.parse(text)
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('LLM returned empty content')
  }
  return content
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const payload = await request.json() as {
      mode?: 'chat' | 'json'
      messages?: ChatMessage[]
      prompt?: string
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      model?: string
    }

    const mode = payload.mode || 'chat'
    const model = payload.model ||
      (mode === 'json' ? env.LLM_JSON_MODEL : env.LLM_CHAT_MODEL) ||
      env.LLM_MODEL ||
      (mode === 'json' ? 'anthropic/claude-sonnet-4.6' : 'anthropic/claude-haiku-4.5')
    const maxTokens = payload.maxTokens || (mode === 'json' ? 12000 : 1200)
    const temperature = payload.temperature ?? (mode === 'json' ? 0.2 : 0.8)

    const baseMessages: ChatMessage[] = payload.prompt
      ? [{ role: 'user', content: payload.prompt }]
      : (payload.messages || [])
    const messages: ChatMessage[] = [
      ...(payload.systemPrompt ? [{ role: 'system' as const, content: payload.systemPrompt }] : []),
      ...baseMessages,
    ]

    if (messages.length === 0) return json({ error: 'messages or prompt required' }, { status: 400 })

    const content = await callTokenRouter(env, {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(mode === 'json' ? { response_format: { type: 'json_object' } } : {}),
    })

    if (mode === 'json') {
      return json({ result: extractJsonObject(content), raw: content })
    }
    return json({ text: content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return json({ error: message }, { status: 500 })
  }
}
