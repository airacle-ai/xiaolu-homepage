import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { getCollisionHistory, type CollisionRecord, type AnalysisVersion } from '../lib/supabase'

export default function TimelinePage() {
  const { user } = useUser()
  const [collisions, setCollisions] = useState<CollisionRecord[]>([])

  useEffect(() => {
    if (!user) return
    getCollisionHistory(user.pin_code).then(setCollisions)
  }, [user])

  if (!user?.dimensions || !user?.identity_label) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-gold/10 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5c542" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-text-secondary mb-1">时间轴还没有内容</p>
        <p className="text-text-muted text-sm">完成自画像后，这里会展示你的变化和模式</p>
      </div>
    )
  }

  const versions: AnalysisVersion[] = user.analysis_versions || []
  const currentLabel = user.identity_label

  // Generate reflection prompts based on identity
  const reflectionPrompts: string[] = []
  if (currentLabel.primary) {
    reflectionPrompts.push(`你现在的身份标签是「${currentLabel.primary}」——这个标签在过去一个月里有没有某个时刻让你觉得"对，我就是这样"？`)
  }
  if (currentLabel.modifiers?.length) {
    reflectionPrompts.push(`你的「${currentLabel.modifiers[0]}」特质——最近一次它帮到你是什么时候？`)
  }
  if (user.dimensions?.evolution_direction) {
    reflectionPrompts.push(`${user.dimensions.evolution_direction}——这周有什么小事让你觉得往这个方向靠近了一步？`)
  }
  if (collisions.length >= 2) {
    reflectionPrompts.push('你和不同人的碰撞结果里，有没有某个角色反复出现？那可能是你天然的关系模式。')
  }
  if (reflectionPrompts.length === 0) {
    reflectionPrompts.push('回头看看你最近的对话——有没有哪个回答让你现在想起来觉得"当时我可能是另一种想法"？')
  }

  // Cross-relationship pattern detection
  const repeatedRoles = detectRepeatedRoles(collisions)
  const commonCollisionPointTypes = detectCommonCollisionTypes(collisions)

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-medium text-text-primary">时间轴</h2>
        <p className="text-xs text-text-muted mt-1">你的变化轨迹和关系模式</p>
      </div>

      {/* Current Identity */}
      <div className="px-4 py-4">
        <div className="bg-bg-card rounded-xl p-5 border border-accent-gold/20">
          <p className="text-xs text-text-muted mb-2">当前身份</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-accent-gold
              [text-shadow:0_0_20px_rgba(245,197,66,0.25)]">
              {currentLabel?.primary}
            </span>
            {currentLabel?.modifiers?.map((m, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full
                bg-accent-teal/15 text-accent-teal border border-accent-teal/30">
                {m}
              </span>
            ))}
          </div>
          {currentLabel?.one_liner && (
            <p className="text-sm text-text-secondary mt-3 italic">"{currentLabel.one_liner}"</p>
          )}
        </div>
      </div>

      {/* Analysis Version History */}
      {versions.length > 1 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-text-muted mb-2 px-1">身份标签演化</p>
          <div className="bg-bg-card rounded-xl border border-text-muted/10 overflow-hidden">
            {[...versions].reverse().map((v, i, arr) => {
              const prev = arr[i + 1] // chronologically earlier version
              const changed = prev && v.identity_label?.primary !== prev.identity_label?.primary
              return (
                <div
                  key={v.version}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    i < arr.length - 1 ? 'border-b border-text-muted/10' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-gold" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {v.identity_label?.primary || '未知'}
                      </span>
                      {changed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-teal/10 text-accent-teal">
                          变化
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {new Date(v.created_at).toLocaleDateString('zh-CN', {
                        month: 'short', day: 'numeric',
                      })}
                      {v.identity_label?.one_liner && ` — ${v.identity_label.one_liner.slice(0, 50)}...`}
                    </p>
                  </div>
                  <span className="text-[10px] text-text-muted flex-shrink-0">v{v.version}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cross-relationship Patterns */}
      {collisions.length >= 2 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-text-muted mb-2 px-1">跨关系模式</p>
          <div className="bg-bg-card rounded-xl border border-text-muted/10 p-4 space-y-3">
            {repeatedRoles.length > 0 && (
              <div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  在不同关系中，你倾向于成为对方的
                  <span className="text-accent-teal font-medium">
                    {repeatedRoles.slice(0, 2).map(r => `「${r.role}」`).join('和')}
                  </span>
                  ——你在关系中常常是那个
                  {repeatedRoles[0]?.description}。
                </p>
              </div>
            )}
            {commonCollisionPointTypes.length > 0 && (
              <div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  你最容易和不同人产生差异的领域是
                  <span className="text-accent-gold font-medium">
                    {commonCollisionPointTypes.slice(0, 2).join('、')}
                  </span>
                  ——这是你关系中需要留意的地方。
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-text-secondary leading-relaxed">
                你共完成了 {collisions.length} 次关系碰撞，涵盖了
                {new Set(collisions.map(c => c.relationship_context).filter(c => c && c !== 'unknown')).size || '多种'}
                种不同类型的关系。
              </p>
            </div>
          </div>
        </div>
      )}

      {collisions.length < 2 && (
        <div className="px-4 pb-4">
          <div className="bg-bg-card rounded-xl border border-text-muted/10 p-4 text-center">
            <p className="text-sm text-text-secondary">
              再碰撞 {2 - collisions.length} 个{ collisions.length === 0 ? '朋友' : '人' }，
              就能看到你在不同关系中的模式
            </p>
            <p className="text-xs text-text-muted mt-1">
              碰撞越多，越能看到你天然的关系倾向
            </p>
          </div>
        </div>
      )}

      {/* Reflection Prompts */}
      <div className="px-4 pb-6">
        <p className="text-xs text-text-muted mb-2 px-1">本周反思</p>
        <div className="bg-bg-card rounded-xl border border-text-muted/10 overflow-hidden">
          {reflectionPrompts.slice(0, 3).map((prompt, i) => (
            <div
              key={i}
              className={`px-4 py-3 ${
                i < Math.min(reflectionPrompts.length, 3) - 1 ? 'border-b border-text-muted/10' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-accent-gold text-sm mt-0.5 flex-shrink-0">
                  {i === 0 ? '①' : i === 1 ? '②' : '③'}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">{prompt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution direction reminder */}
      {user.dimensions?.evolution_direction && (
        <div className="px-4 pb-8">
          <div className="bg-gradient-to-r from-accent-gold/5 to-accent-teal/5
            rounded-xl p-4 border border-accent-gold/10 text-center">
            <p className="text-xs text-text-muted mb-1">演化方向</p>
            <p className="text-sm text-text-primary italic leading-relaxed">
              {user.dimensions.evolution_direction}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: detect repeated roles across collisions (basic client-side analysis)
function detectRepeatedRoles(collisions: CollisionRecord[]): Array<{ role: string; description: string }> {
  const roleCount: Record<string, { count: number; description: string }> = {}
  for (const c of collisions) {
    const result = c.result
    if (!result?.roles_for_b?.primary) continue
    for (const role of result.roles_for_b.primary) {
      if (!roleCount[role.role_name]) {
        roleCount[role.role_name] = { count: 0, description: role.description }
      }
      roleCount[role.role_name].count++
    }
  }
  return Object.entries(roleCount)
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k, v]) => ({ role: k, description: v.description.slice(0, 30) }))
}

function detectCommonCollisionTypes(collisions: CollisionRecord[]): string[] {
  const typeCount: Record<string, number> = {}
  for (const c of collisions) {
    const points = c.result?.collision_points
    if (!points) continue
    for (const p of points) {
      const title = p.title
      typeCount[title] = (typeCount[title] || 0) + 1
    }
  }
  return Object.entries(typeCount)
    .filter(([, v]) => v >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
}
