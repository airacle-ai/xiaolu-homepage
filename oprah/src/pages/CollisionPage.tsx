import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import {
  getUserByMatchCode,
  saveCollision,
  getCollisionHistory,
  type CollisionLayer,
  type CollisionRecord,
  type CollisionResult,
  type DimensionResult,
  type RoleCard,
  type RoleDirection,
  type RelationshipContext,
} from '../lib/supabase'
import { generateCollision, generateSpeculativeCollision } from '../lib/collision'
import { ARCHETYPES, getArchetypesByCategory, type Archetype } from '../lib/archetypes'
import InviteCard from '../components/InviteCard'

const LAYER_COLORS: Record<CollisionLayer, string> = {
  思维: '#4ecdc4',
  行动: '#f5c542',
  情感: '#ff6b6b',
  成长: '#c084fc',
  关系动力学: '#94a3b8',
}

const RELATIONSHIP_OPTIONS: { value: RelationshipContext; label: string; icon: string }[] = [
  { value: 'romantic', label: '恋人 / 伴侣', icon: '💕' },
  { value: 'close_friend', label: '密友', icon: '🤝' },
  { value: 'family', label: '家人', icon: '🏠' },
  { value: 'colleague', label: '同事 / 合作伙伴', icon: '💼' },
  { value: 'new_acquaintance', label: '刚认识，想了解', icon: '👋' },
]

type CollisionMode = 'code' | 'archetype'

export default function CollisionPage() {
  const { user } = useUser()
  const [mode, setMode] = useState<CollisionMode>('code')
  const [code, setCode] = useState('')
  const [relationshipContext, setRelationshipContext] = useState<RelationshipContext>('unknown')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<CollisionRecord[]>([])

  // Speculative mode
  const [showSpeculative, setShowSpeculative] = useState(false)
  const [friendDescription, setFriendDescription] = useState('')

  // Archetype mode
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null)
  const [archetypeCategory, setArchetypeCategory] = useState<Archetype['category'] | 'all'>('all')

  // Invite card
  const [showInviteCard, setShowInviteCard] = useState(false)
  const [lastCollisionResult, setLastCollisionResult] = useState<CollisionResult | null>(null)

  useEffect(() => {
    if (!user) return
    getCollisionHistory(user.pin_code).then(setHistory)
  }, [user])

  // Detect low-confidence dimensions for subtle hint
  const dims = user?.dimensions as DimensionResult | null
  const lowConfidenceDims: string[] = []
  if (dims) {
    const check = (item: { confidence?: number } | undefined, name: string) => {
      if (item && typeof item.confidence === 'number' && item.confidence < 40) lowConfidenceDims.push(name)
    }
    check(dims.thinking_styles.info_processing, '信息处理')
    check(dims.thinking_styles.uncertainty_response, '不确定性应对')
    check(dims.thinking_styles.conflict_handling, '冲突处理')
    check(dims.thinking_styles.expression_thinking, '表达与思考')
    check(dims.thinking_styles.abstraction_level, '抽象层级')
    check(dims.values.truth_vs_kindness, '真实vs善意')
    check(dims.values.freedom_vs_belonging, '自由vs归属')
    check(dims.values.fairness_vs_care, '公平vs关怀')
    check(dims.values.present_vs_future, '现在vs未来')
    check(dims.values.depth_vs_breadth, '深度vs广度')
    check(dims.relationship_patterns.attachment_style, '依恋风格')
    check(dims.relationship_patterns.intimacy_language, '亲密语言')
    check(dims.relationship_patterns.boundary_style, '边界风格')
    check(dims.relationship_patterns.social_energy, '社交能量')
    check(dims.relationship_patterns.conflict_repair, '冲突修复')
    check(dims.unfinished_self.suppressed_expression, '被压抑的表达')
    check(dims.unfinished_self.aspired_identity, '向往的身份')
    check(dims.unfinished_self.escape_direction, '逃离的方向')
    check(dims.unfinished_self.desired_role, '渴望角色')
  }

  if (!user?.match_code || !user?.dimensions) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-teal/10 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.8">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-text-secondary mb-1">还不能碰撞</p>
        <p className="text-text-muted text-sm">完成与 Oprah 的对话并生成暗号后，才能与朋友碰撞</p>
      </div>
    )
  }

  const handleCodeCollision = async () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 4 || !/^[A-Z]{4}$/.test(trimmed)) {
      setError('请输入 4 位大写字母暗号')
      return
    }
    if (trimmed === user.match_code) {
      setError('不能和自己碰撞哦')
      return
    }

    setLoading(true)
    setError('')

    try {
      const friend = await getUserByMatchCode(trimmed)
      if (!friend) {
        setError('')
        setShowSpeculative(true)
        setLoading(false)
        return
      }
      if (!friend.dimensions) {
        setError('这位朋友还在探索中，暂时无法碰撞')
        setLoading(false)
        return
      }

      const result = await generateCollision(
        user.dimensions as DimensionResult,
        friend.dimensions as DimensionResult,
        relationshipContext
      )
      const record = await saveCollision(user.pin_code, trimmed, result, relationshipContext)
      setHistory((prev) => [record, ...prev])
      setCode('')
      setLastCollisionResult(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setError(`碰撞失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSpeculativeCollision = async () => {
    if (!friendDescription.trim()) {
      setError('请描述一下这位朋友')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await generateSpeculativeCollision(
        user.dimensions as DimensionResult,
        friendDescription.trim(),
        relationshipContext
      )
      const displayCode = code.trim().toUpperCase() || '????'
      const record = await saveCollision(user.pin_code, displayCode, result, relationshipContext)
      setHistory((prev) => [record, ...prev])
      setCode('')
      setFriendDescription('')
      setShowSpeculative(false)
      setLastCollisionResult(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setError(`碰撞失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleArchetypeCollision = async (archetype: Archetype) => {
    setLoading(true)
    setError('')

    try {
      const result = await generateCollision(
        user.dimensions as DimensionResult,
        archetype.dimensions,
        relationshipContext
      )
      const record = await saveCollision(user.pin_code, archetype.id, result, relationshipContext)
      setHistory((prev) => [record, ...prev])
      setSelectedArchetype(null)
      setLastCollisionResult(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setError(`碰撞失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(ARCHETYPES.map((a) => a.category))] as Array<Archetype['category'] | 'all'>
  const filteredArchetypes = archetypeCategory === 'all'
    ? ARCHETYPES
    : getArchetypesByCategory(archetypeCategory)

  return (
    <div className="h-full overflow-y-auto">
      {/* Low confidence hint */}
      {lowConfidenceDims.length > 0 && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-accent-gold/5 border border-accent-gold/15
          flex items-start gap-2">
          <span className="text-accent-gold text-sm flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-xs text-text-secondary leading-relaxed">
              你的画像中有 <span className="text-accent-gold font-medium">{lowConfidenceDims.length} 个维度</span>还未充分探索。
              碰撞结果在这些领域可能不够精准——
              <a href="/map" className="text-accent-gold/70 hover:text-accent-gold underline ml-0.5 transition-colors">
                去地图页继续探索
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex border-b border-text-muted/15">
        <button
          onClick={() => { setMode('code'); setShowSpeculative(false) }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === 'code'
              ? 'text-accent-teal border-b-2 border-accent-teal'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          朋友暗号
        </button>
        <button
          onClick={() => setMode('archetype')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === 'archetype'
              ? 'text-accent-teal border-b-2 border-accent-teal'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          原型碰撞
        </button>
      </div>

      {/* === Code Mode === */}
      {mode === 'code' && (
        <div className="px-3 pt-4 pb-3 border-b border-text-muted/15">
          {!showSpeculative ? (
            <>
              <div className="flex gap-2 items-stretch">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="朋友的 4 位暗号"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))
                    setError('')
                  }}
                  className="flex-1 min-w-0 bg-bg-secondary border border-text-muted/20 rounded-xl px-3 py-2.5
                    text-center text-base font-mono tracking-[0.25em]
                    text-text-primary placeholder:text-text-muted placeholder:tracking-normal placeholder:text-sm placeholder:font-sans
                    focus:outline-none focus:border-accent-teal/50 transition-colors"
                />
                <button
                  onClick={handleCodeCollision}
                  disabled={code.length !== 4 || loading}
                  className="flex-shrink-0 px-4 rounded-xl bg-accent-teal text-bg-primary font-medium text-sm
                    disabled:opacity-30 active:scale-[0.97] transition-all whitespace-nowrap"
                >
                  {loading ? '分析中' : '碰撞'}
                </button>
              </div>

              {/* Relationship type selector */}
              <div className="mt-3">
                <p className="text-xs text-text-muted mb-2">TA是你的...？（可选，让分析更精准）</p>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRelationshipContext(relationshipContext === opt.value ? 'unknown' : opt.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                        relationshipContext === opt.value
                          ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40'
                          : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Speculative collision */
            <div>
              <p className="text-sm text-text-secondary mb-2">
                对方还不在系统中？没关系——描述一下ta，我也能分析你们之间的关系。
              </p>
              <p className="text-xs text-text-muted mb-3">
                基于你的描述，结果可能不如双方都完成画像那么精准——但足以让你看到一些有趣的可能。
              </p>
              <textarea
                value={friendDescription}
                onChange={(e) => setFriendDescription(e.target.value)}
                placeholder="描述一下这位朋友——ta是什么样的人？做决定靠直觉还是分析？在群体中是说话还是观察？你们是怎么相处的？..."
                rows={4}
                className="w-full bg-bg-secondary border border-text-muted/20 rounded-xl px-3 py-2.5
                  text-sm text-text-primary placeholder:text-text-muted
                  focus:outline-none focus:border-accent-teal/50 transition-colors resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowSpeculative(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-text-secondary text-sm
                    border border-white/10 active:scale-[0.97] transition-all"
                >
                  返回
                </button>
                <button
                  onClick={handleSpeculativeCollision}
                  disabled={!friendDescription.trim() || loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-accent-teal text-bg-primary font-medium text-sm
                    disabled:opacity-30 active:scale-[0.97] transition-all"
                >
                  {loading ? '分析中...' : '开始推测碰撞'}
                </button>
              </div>
              {/* Relationship type for speculative too */}
              <div className="mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRelationshipContext(relationshipContext === opt.value ? 'unknown' : opt.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                        relationshipContext === opt.value
                          ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40'
                          : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-2 text-center break-words">{error}</p>}
        </div>
      )}

      {/* === Archetype Mode === */}
      {mode === 'archetype' && (
        <div className="px-3 pt-4 pb-3 border-b border-text-muted/15">
          <p className="text-xs text-text-muted mb-3">
            选择一个原型角色，看看如果你们认识会是什么样的关系。这是单人也能玩的碰撞。
          </p>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setArchetypeCategory(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                  archetypeCategory === cat
                    ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40'
                    : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'
                }`}
              >
                {cat === 'all' ? '全部' : cat === 'relationship' ? '关系型' : cat === 'thinking' ? '思维型' : cat === 'energy' ? '能量型' : '成长型'}
              </button>
            ))}
          </div>

          {/* Archetype grid */}
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {filteredArchetypes.map((arch) => (
              <button
                key={arch.id}
                onClick={() => setSelectedArchetype(arch)}
                className="text-left p-3 rounded-xl bg-white/5 border border-white/5
                  hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">{arch.name}</span>
                  <span className="text-[10px] text-text-muted">
                    {arch.category === 'relationship' ? '关系' : arch.category === 'thinking' ? '思维' : arch.category === 'energy' ? '能量' : '成长'}
                  </span>
                </div>
                <p className="text-xs text-text-muted">{arch.tagline}</p>
              </button>
            ))}
          </div>

          {/* Relationship type selector for archetypes */}
          <div className="mt-3">
            <p className="text-xs text-text-muted mb-2">假设你们是什么关系？</p>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRelationshipContext(relationshipContext === opt.value ? 'unknown' : opt.value)}
                  className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                    relationshipContext === opt.value
                      ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40'
                      : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected archetype detail + confirm */}
          {selectedArchetype && (
            <div className="mt-3 p-4 rounded-xl bg-accent-teal/5 border border-accent-teal/20 animate-fade-in-up">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium text-text-primary">{selectedArchetype.name}</span>
                <button
                  onClick={() => setSelectedArchetype(null)}
                  className="text-text-muted hover:text-text-secondary p-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                {selectedArchetype.description}
              </p>
              <button
                onClick={() => handleArchetypeCollision(selectedArchetype)}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-accent-teal text-bg-primary font-medium text-sm
                  disabled:opacity-30 active:scale-[0.97] transition-all"
              >
                {loading ? '分析中...' : `和「${selectedArchetype.name}」碰撞`}
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-2 text-center break-words">{error}</p>}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent-teal/20" />
            <div className="absolute inset-0 rounded-full border-2 border-accent-teal border-t-transparent animate-spin" />
          </div>
          <p className="text-text-secondary text-sm">正在分析你们之间的化学反应...</p>
        </div>
      )}

      {/* Collision history */}
      <div className="px-4 py-4 space-y-4">
        {history.map((record) => (
          <CollisionCard
            key={record.id}
            record={record}
            onShare={(result) => {
              setLastCollisionResult(result)
              setShowInviteCard(true)
            }}
          />
        ))}

        {history.length === 0 && !loading && (
          <p className="text-center text-text-muted text-sm py-8">
            还没有碰撞记录，输入朋友的暗号或选择一个原型角色开始吧
          </p>
        )}

        {history.length > 0 && !loading && (
          <p className="text-center text-text-muted text-xs py-2">
            以上是本地保存的碰撞历史
          </p>
        )}
      </div>

      {/* Invite Card Modal */}
      {showInviteCard && lastCollisionResult && (
        <InviteCard
          result={lastCollisionResult}
          userIdentityLabel={user.identity_label || undefined}
          matchCode={user.match_code || ''}
          onClose={() => setShowInviteCard(false)}
        />
      )}
    </div>
  )
}

// ---- Migration helper (kept from original) ----

function migrateText(s: string): string {
  return s
    .replace(/用户\s*A/g, '你')
    .replace(/用户\s*B/g, '对方')
    .replace(/(?<![A-Za-z])A(?![A-Za-z])/g, '你')
    .replace(/(?<![A-Za-z])B(?![A-Za-z])/g, '对方')
    .replace(/TA/g, '对方')
}

function migrateRole(r: RoleCard): RoleCard {
  return { ...r, description: migrateText(r.description) }
}

function migrateDirection(d: RoleDirection): RoleDirection {
  return {
    primary: d.primary.map(migrateRole),
    supplementary: d.supplementary.map(migrateRole),
  }
}

function migrateResult(r: CollisionResult): CollisionResult {
  return {
    roles_for_a: r.roles_for_a ? migrateDirection(r.roles_for_a) : undefined,
    roles_for_b: r.roles_for_b ? migrateDirection(r.roles_for_b) : undefined,
    third_entity: r.third_entity
      ? { metaphor: migrateText(r.third_entity.metaphor), description: migrateText(r.third_entity.description) }
      : undefined,
    collision_points: r.collision_points.map((p) => ({
      title: migrateText(p.title),
      difference: migrateText(p.difference),
      daily_manifestation: migrateText(p.daily_manifestation),
      growth_opportunity: migrateText(p.growth_opportunity),
    })),
    resonance_zones: r.resonance_zones.map((z) => ({
      title: migrateText(z.title),
      similarity: migrateText(z.similarity),
      effect: migrateText(z.effect),
    })),
    friction_warning: {
      title: migrateText(r.friction_warning.title),
      risk: migrateText(r.friction_warning.risk),
      suggestion: migrateText(r.friction_warning.suggestion),
    },
    relationship_potential: migrateText(r.relationship_potential),
    relationship_type: r.relationship_type,
    relationship_context: r.relationship_context,
    action_hints: r.action_hints,
  }
}

// ---- Collision Card ----

function CollisionCard({ record, onShare }: {
  record: CollisionRecord
  onShare?: (result: CollisionResult) => void
}) {
  const rawResult = record.result as CollisionResult | null
  const result = rawResult ? migrateResult(rawResult) : null
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  if (!result) return null

  const toggle = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const time = new Date(record.created_at).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const contextLabel: Record<string, string> = {
    romantic: '恋人',
    close_friend: '密友',
    family: '家人',
    colleague: '同事',
    new_acquaintance: '刚认识',
    archetype: '原型',
    unknown: '',
  }

  // Section ordering based on relationship type
  const ctx = record.relationship_context || 'unknown'
  const sectionOrder: string[] = (() => {
    switch (ctx) {
      case 'romantic':
        return ['roles_a', 'roles_b', 'collision', 'resonance', 'friction', 'actions']
      case 'close_friend':
        return ['resonance', 'roles_a', 'roles_b', 'collision', 'friction', 'actions']
      case 'family':
        return ['collision', 'roles_a', 'roles_b', 'friction', 'resonance', 'actions']
      case 'colleague':
        return ['collision', 'friction', 'roles_a', 'roles_b', 'resonance', 'actions']
      case 'new_acquaintance':
        return ['friction', 'resonance', 'collision', 'roles_a', 'roles_b', 'actions']
      default:
        return ['roles_a', 'roles_b', 'collision', 'resonance', 'friction', 'actions']
    }
  })()

  return (
    <div className="bg-bg-card rounded-xl border border-text-muted/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-text-muted/10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-accent-gold tracking-widest font-medium">
            {record.friend_code}
          </span>
          {record.relationship_context && record.relationship_context !== 'unknown' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
              {contextLabel[record.relationship_context] || record.relationship_context}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">{time}</span>
      </div>

      {/* Relationship Type Banner */}
      {result.relationship_type && (
        <div className="px-4 py-3 bg-gradient-to-r from-accent-gold/10 to-accent-teal/10
          flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-accent-gold
              [text-shadow:0_0_15px_rgba(245,197,66,0.2)]">
              {result.relationship_type}
            </span>
            {result.relationship_potential && (
              <p className="text-xs text-text-secondary mt-0.5 italic">
                "{result.relationship_potential}"
              </p>
            )}
          </div>
          {onShare && (
            <button
              onClick={() => onShare(result)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-text-secondary
                hover:bg-white/20 active:scale-95 transition-all"
            >
              分享
            </button>
          )}
        </div>
      )}

      {/* Dynamic sections ordered by relationship context */}
      {sectionOrder.map((section) => {
        switch (section) {
          case 'roles_a':
            return result.roles_for_a ? (
              <RolesSection key="roles_a" title="对方之于你" direction={result.roles_for_a} />
            ) : null
          case 'roles_b':
            return result.roles_for_b ? (
              <RolesSection key="roles_b" title="你之于对方" direction={result.roles_for_b} tintBg />
            ) : null
          case 'collision':
            return (
              <div key="collision">
                <button onClick={() => toggle('collision')}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-text-muted/10">
                  <span className="text-sm text-text-primary">
                    {ctx === 'romantic' ? '相处模式差异' : ctx === 'family' ? '潜在摩擦点' : ctx === 'colleague' ? '工作风格差异' : `碰撞点 (${result.collision_points.length})`}
                  </span>
                  <Chevron open={expandedSection === 'collision'} />
                </button>
                {expandedSection === 'collision' && (
                  <div className="px-4 pb-3 space-y-3">
                    {result.collision_points.map((point, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <p className="text-sm font-medium text-accent-gold mb-1">{point.title}</p>
                        <p className="text-sm text-text-secondary leading-relaxed">{point.difference}</p>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">{point.daily_manifestation}</p>
                        <p className="text-xs text-accent-teal/80 mt-1 leading-relaxed">{point.growth_opportunity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          case 'resonance':
            return (
              <div key="resonance">
                <button onClick={() => toggle('resonance')}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-text-muted/10">
                  <span className="text-sm text-text-primary">
                    {ctx === 'close_friend' ? '为什么这么合得来' : `共鸣区 (${result.resonance_zones.length})`}
                  </span>
                  <Chevron open={expandedSection === 'resonance'} />
                </button>
                {expandedSection === 'resonance' && (
                  <div className="px-4 pb-3 space-y-3">
                    {result.resonance_zones.map((zone, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <p className="text-sm font-medium text-accent-teal mb-1">{zone.title}</p>
                        <p className="text-sm text-text-secondary leading-relaxed">{zone.similarity}</p>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">{zone.effect}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          case 'friction':
            return (
              <div key="friction">
                <button onClick={() => toggle('friction')}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-text-muted/10">
                  <span className="text-sm text-text-primary">
                    {ctx === 'new_acquaintance' ? '需要注意的地方' : ctx === 'colleague' ? '配合注意事项' : '摩擦预警'}
                  </span>
                  <Chevron open={expandedSection === 'friction'} />
                </button>
                {expandedSection === 'friction' && (
                  <div className="px-4 pb-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-400/80 mb-1">{result.friction_warning.title}</p>
                      <p className="text-sm text-text-secondary leading-relaxed">{result.friction_warning.risk}</p>
                      <p className="text-xs text-accent-teal/80 mt-2 leading-relaxed">{result.friction_warning.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          case 'actions':
            return result.action_hints && result.action_hints.length > 0 ? (
              <div key="actions">
                <button onClick={() => toggle('actions')}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-text-muted/10">
                  <span className="text-sm text-text-primary">试试看 ({result.action_hints.length})</span>
                  <Chevron open={expandedSection === 'actions'} />
                </button>
                {expandedSection === 'actions' && (
                  <div className="px-4 pb-3 space-y-3">
                    {result.action_hints.map((hint, i) => (
                      <div key={i} className="bg-accent-teal/5 rounded-lg p-3 border border-accent-teal/15">
                        <p className="text-xs text-text-muted mb-1">{hint.scenario}</p>
                        <p className="text-sm text-text-primary leading-relaxed font-medium">{hint.action}</p>
                        <p className="text-[11px] text-accent-teal/70 mt-2">为什么：{hint.based_on} → {hint.expected_effect}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          default:
            return null
        }
      })}

      {/* Legacy third_entity fallback */}
      {!result.roles_for_a && !result.roles_for_b && result.third_entity && (
        <div className="px-4 py-4 bg-gradient-to-br from-accent-gold/5 to-accent-teal/5">
          <p className="text-sm text-text-primary leading-relaxed font-medium">{result.third_entity.metaphor}</p>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">{result.third_entity.description}</p>
        </div>
      )}

      {/* Relationship Potential (fallback if no type banner) */}
      {!result.relationship_type && (
        <div className="px-4 py-3 border-t border-text-muted/10 bg-white/[0.02]">
          <p className="text-sm text-text-primary leading-relaxed italic text-center">
            "{result.relationship_potential}"
          </p>
        </div>
      )}

      {/* Speculative note */}
      {record.friend_code === '????' && (
        <div className="px-4 py-2 bg-accent-gold/5 border-t border-accent-gold/10">
          <p className="text-[11px] text-accent-gold/80 text-center">
            基于你的描述推测，真实碰撞可能不同
          </p>
        </div>
      )}
    </div>
  )
}

// ---- Sub-components ----

function RolesSection({ title, direction, tintBg }: {
  title: string
  direction: RoleDirection
  tintBg?: boolean
}) {
  const [hero, second, third] = direction.primary
  if (!hero) return null
  return (
    <div className={`px-4 py-4 border-t border-text-muted/10 ${
      tintBg ? 'bg-gradient-to-br from-accent-teal/5 to-transparent'
        : 'bg-gradient-to-br from-accent-gold/5 to-transparent'
    }`}>
      <p className="text-xs text-text-muted mb-3 tracking-wider">{title}</p>
      <RoleCardHero role={hero} />
      {(second || third) && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {second && <RoleCardMedium role={second} />}
          {third && <RoleCardMedium role={third} />}
        </div>
      )}
      {direction.supplementary.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] text-text-muted">补充角色</p>
          {direction.supplementary.map((r, i) => (
            <RoleCardSmall key={i} role={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function LayerChip({ layer }: { layer: CollisionLayer }) {
  const color = LAYER_COLORS[layer] ?? '#94a3b8'
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}15` }}>
      {layer}
    </span>
  )
}

function RoleCardHero({ role }: { role: RoleCard }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-accent-gold/25">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl font-semibold text-accent-gold
          [text-shadow:0_0_20px_rgba(245,197,66,0.25)]">
          {role.role_name}
        </span>
        <LayerChip layer={role.layer} />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{role.description}</p>
    </div>
  )
}

function RoleCardMedium({ role }: { role: RoleCard }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span className="text-sm font-medium text-text-primary">{role.role_name}</span>
        <LayerChip layer={role.layer} />
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{role.description}</p>
    </div>
  )
}

function RoleCardSmall({ role }: { role: RoleCard }) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="text-xs font-medium text-text-secondary">{role.role_name}</span>
        <LayerChip layer={role.layer} />
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{role.description}</p>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
