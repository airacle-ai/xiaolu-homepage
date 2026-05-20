import { analyzeDimensions } from './claude'
import { updateUser, getUserByMatchCode, type ChatMessage, type UserRecord, type DimensionResult, type IdentityLabel, type AnalysisVersion } from './supabase'

// Generate a unique 4-letter match code
async function generateUniqueMatchCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * 26)]
    }
    const existing = await getUserByMatchCode(code)
    if (!existing) return code
  }
  // Fallback (highly unlikely)
  throw new Error('无法生成唯一暗号，请重试')
}

/**
 * Run dimension analysis for a user.
 * - If user has no match_code, generates one and saves it along with dimensions (first-time analysis).
 * - If user already has a match_code, only updates dimensions (refinement).
 * - If `refinement` is provided, the model is instructed to only update the focus dimension
 *   and keep all other 18 dimensions verbatim from the previous result.
 *
 * Returns the updated user record fields.
 */
export async function runAnalysis(
  user: UserRecord,
  messages: ChatMessage[],
  refinement?: { previous: DimensionResult; focusKey: string; focusLabel: string }
): Promise<{ dimensions: DimensionResult; matchCode: string; identityLabel: IdentityLabel }> {
  const result = (await analyzeDimensions(messages, refinement)) as DimensionResult

  const identityLabel: IdentityLabel = result.identity_label || {
    primary: '探索者',
    modifiers: [],
    one_liner: result.overall_portrait?.slice(0, 80) || '',
  }

  // Build analysis version record
  const existingVersions = user.analysis_versions || []
  const newVersion: AnalysisVersion = {
    version: existingVersions.length + 1,
    dimensions: result,
    identity_label: identityLabel,
    created_at: new Date().toISOString(),
  }

  let matchCode = user.match_code
  if (!matchCode) {
    matchCode = await generateUniqueMatchCode()
    await updateUser(user.pin_code, {
      dimensions: result,
      match_code: matchCode,
      identity_label: identityLabel,
      analysis_versions: [newVersion],
    })
  } else {
    await updateUser(user.pin_code, {
      dimensions: result,
      identity_label: identityLabel,
      analysis_versions: [...existingVersions, newVersion],
    })
  }

  return { dimensions: result, matchCode, identityLabel }
}
