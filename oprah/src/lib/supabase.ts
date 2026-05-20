import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'REDACTED_SUPABASE_PUBLISHABLE_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const USE_LOCAL_DEMO =
  !supabaseUrl.includes('.supabase.co') ||
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.startsWith('REDACTED') ||
  supabaseAnonKey.startsWith('your_')

const nowIso = () => new Date().toISOString()
const userKey = (pinCode: string) => `oprah:user:${pinCode}`
const collisionKey = (pinCode: string) => `oprah:collisions:${pinCode}`

function loadLocalUser(pinCode: string): UserRecord | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(userKey(pinCode))
  return raw ? JSON.parse(raw) as UserRecord : null
}

function saveLocalUser(user: UserRecord) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(userKey(user.pin_code), JSON.stringify(user))
}

function loadLocalCollisions(pinCode: string): CollisionRecord[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(collisionKey(pinCode))
  return raw ? JSON.parse(raw) as CollisionRecord[] : []
}

function saveLocalCollisions(pinCode: string, rows: CollisionRecord[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(collisionKey(pinCode), JSON.stringify(rows))
}

// ---- 类型定义 ----

export interface StructuredEvidence {
  summary: string
  quotes: {
    turnIndex: number
    userSaid: string
    situation: string
    signal: string
  }[]
  consistency: 'cross_situational' | 'single_situation' | 'inferred'
}

export interface IdentityLabel {
  primary: string
  modifiers: string[]
  one_liner: string
}

export interface ActionHint {
  scenario: string
  action: string
  based_on: string
  expected_effect: string
  feedback?: 'helpful' | 'not_for_me' | 'not_tried'
}

export type RelationshipContext = 'romantic' | 'close_friend' | 'family' | 'colleague' | 'new_acquaintance' | 'archetype' | 'unknown'

export interface UserRecord {
  pin_code: string
  match_code: string | null
  chat_history: ChatMessage[]
  dimensions: DimensionResult | null
  progress: Record<string, unknown>
  identity_label: IdentityLabel | null
  analysis_versions: AnalysisVersion[]
  created_at: string
  updated_at: string
}

export interface AnalysisVersion {
  version: number
  dimensions: DimensionResult
  identity_label: IdentityLabel
  created_at: string
}

export interface CollisionRecord {
  id: string
  user_pin: string
  friend_code: string
  result: CollisionResult | null
  relationship_context: RelationshipContext
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 维度分析结果的类型
export interface DimensionResult {
  thinking_styles: {
    info_processing: DimensionItem
    uncertainty_response: DimensionItem
    conflict_handling: DimensionItem
    expression_thinking: DimensionItem
    abstraction_level: DimensionItem
  }
  values: {
    truth_vs_kindness: ValueDimensionItem
    freedom_vs_belonging: ValueDimensionItem
    fairness_vs_care: ValueDimensionItem
    present_vs_future: ValueDimensionItem
    depth_vs_breadth: ValueDimensionItem
  }
  relationship_patterns: {
    attachment_style: AttachmentItem
    intimacy_language: IntimacyItem
    boundary_style: DimensionItem
    social_energy: DimensionItem
    conflict_repair: DimensionItem
  }
  unfinished_self: {
    suppressed_expression: UnfinishedItem
    aspired_identity: UnfinishedItem
    escape_direction: UnfinishedItem
    desired_role: UnfinishedItem
  }
  overall_portrait: string
  evolution_direction: string
  identity_label?: IdentityLabel
}

export interface DimensionItem {
  result: string
  confidence: number
  evidence: string
  evidence_structured?: StructuredEvidence
  insight: string
}

export interface ValueDimensionItem {
  result: number // -100 to 100
  confidence: number
  evidence: string
  evidence_structured?: StructuredEvidence
  insight: string
}

export interface AttachmentItem {
  result: string
  anxiety_score: number
  avoidance_score: number
  confidence: number
  evidence: string
  evidence_structured?: StructuredEvidence
  insight: string
}

export interface IntimacyItem {
  primary: string
  secondary: string
  confidence: number
  evidence: string
  evidence_structured?: StructuredEvidence
  insight: string
}

export interface UnfinishedItem {
  description: string
  confidence: number
  evidence: string
  evidence_structured?: StructuredEvidence
  insight: string
}

// 碰撞结果类型
export type CollisionLayer = '思维' | '行动' | '情感' | '成长' | '关系动力学'

export interface RoleCard {
  role_name: string
  layer: CollisionLayer
  description: string
}

export interface RoleDirection {
  primary: RoleCard[]       // 3 个，按强度从高到低
  supplementary: RoleCard[] // 2 个
}

export interface CollisionResult {
  // New format — non-symmetric roles
  roles_for_a?: RoleDirection  // 对方之于你
  roles_for_b?: RoleDirection  // 你之于对方

  // Legacy format — kept optional so old records still render
  third_entity?: {
    metaphor: string
    description: string
  }

  // Shared across both formats
  collision_points: Array<{
    title: string
    difference: string
    daily_manifestation: string
    growth_opportunity: string
  }>
  resonance_zones: Array<{
    title: string
    similarity: string
    effect: string
  }>
  friction_warning: {
    title: string
    risk: string
    suggestion: string
  }
  relationship_potential: string

  // Phase 2+3: relationship type naming, context, and action hints
  relationship_type?: string
  relationship_context?: RelationshipContext
  action_hints?: ActionHint[]
}

// ---- 数据库操作 ----

export async function getUser(pinCode: string): Promise<UserRecord | null> {
  if (USE_LOCAL_DEMO) return loadLocalUser(pinCode)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('pin_code', pinCode)
    .single()

  if (error) return null
  return data as UserRecord
}

export async function createUser(pinCode: string): Promise<UserRecord> {
  if (USE_LOCAL_DEMO) {
    const user: UserRecord = {
      pin_code: pinCode,
      match_code: null,
      chat_history: [],
      dimensions: null,
      progress: {},
      identity_label: null,
      analysis_versions: [],
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    saveLocalUser(user)
    return user
  }
  const { data, error } = await supabase
    .from('users')
    .insert({ pin_code: pinCode })
    .select()
    .single()

  if (error) throw new Error(`创建用户失败: ${error.message}`)
  return data as UserRecord
}

export async function updateUser(
  pinCode: string,
  updates: Partial<Pick<UserRecord, 'chat_history' | 'dimensions' | 'match_code' | 'progress' | 'identity_label' | 'analysis_versions'>>
): Promise<void> {
  if (USE_LOCAL_DEMO) {
    const existing = loadLocalUser(pinCode)
    if (!existing) throw new Error('用户不存在')
    saveLocalUser({ ...existing, ...updates, updated_at: nowIso() })
    return
  }
  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('pin_code', pinCode)

  if (error) throw new Error(`更新用户失败: ${error.message}`)
}

export async function getUserByMatchCode(matchCode: string): Promise<UserRecord | null> {
  if (USE_LOCAL_DEMO) {
    if (typeof localStorage === 'undefined') return null
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('oprah:user:')) continue
      const user = JSON.parse(localStorage.getItem(key) || '{}') as UserRecord
      if (user.match_code === matchCode) return user
    }
    return null
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('match_code', matchCode)
    .single()

  if (error) return null
  return data as UserRecord
}

export async function isMatchCodeUnique(matchCode: string): Promise<boolean> {
  if (USE_LOCAL_DEMO) return !(await getUserByMatchCode(matchCode))
  const { data } = await supabase
    .from('users')
    .select('match_code')
    .eq('match_code', matchCode)
    .single()

  return !data
}

export async function saveCollision(
  userPin: string,
  friendCode: string,
  result: CollisionResult,
  relationshipContext: RelationshipContext = 'unknown'
): Promise<CollisionRecord> {
  if (USE_LOCAL_DEMO) {
    const record: CollisionRecord = {
      id: crypto.randomUUID(),
      user_pin: userPin,
      friend_code: friendCode,
      result,
      relationship_context: relationshipContext,
      created_at: nowIso(),
    }
    const rows = [record, ...loadLocalCollisions(userPin)]
    saveLocalCollisions(userPin, rows)
    return record
  }
  const { data, error } = await supabase
    .from('collisions')
    .insert({ user_pin: userPin, friend_code: friendCode, result, relationship_context: relationshipContext })
    .select()
    .single()

  if (error) throw new Error(`保存碰撞失败: ${error.message}`)
  return data as CollisionRecord
}

export async function getCollisionHistory(userPin: string): Promise<CollisionRecord[]> {
  if (USE_LOCAL_DEMO) return loadLocalCollisions(userPin)
  const { data, error } = await supabase
    .from('collisions')
    .select('*')
    .eq('user_pin', userPin)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as CollisionRecord[]
}
