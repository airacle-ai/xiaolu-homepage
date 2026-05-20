/**
 * Extract the first complete top-level JSON object from a string.
 * Handles cases where the LLM wraps JSON in markdown code blocks
 * or adds explanatory text before/after.
 *
 * Uses brace counting (with string/escape awareness) to find the first
 * balanced `{...}` block, rather than a greedy regex that can over-match.
 */
export function extractJson(text: string): unknown {
  // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
  let s = text.trim()
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) s = fenceMatch[1].trim()

  // Find the first '{'
  const start = s.indexOf('{')
  if (start === -1) {
    throw new Error('No JSON object found in response')
  }

  // Walk forward counting braces, respecting strings and escapes
  let depth = 0
  let inString = false
  let escape = false
  let end = -1

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
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }

  if (end === -1) {
    throw new Error('Unterminated JSON object in response')
  }

  const jsonStr = s.slice(start, end + 1)
  return JSON.parse(jsonStr)
}
