import { useState } from 'react'
import type { StructuredEvidence } from '../lib/supabase'

interface EvidencePanelProps {
  evidence: string
  evidenceStructured?: StructuredEvidence
  insight: string
  dimKey: string
  dimLabel: string
  onRefine?: (key: string, label: string, confidence: number) => void
  confidence: number
  onDisagree?: (key: string, label: string) => void
}

export default function EvidencePanel({
  evidence,
  evidenceStructured,
  insight,
  dimKey,
  dimLabel,
  onRefine,
  confidence,
  onDisagree,
}: EvidencePanelProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(1)

  const consistencyLabel: Record<string, string> = {
    cross_situational: '跨情境一致',
    single_situation: '单情境观察',
    inferred: '间接推断',
  }

  return (
    <div className="bg-bg-secondary/50 rounded-lg border border-text-muted/10 overflow-hidden">
      {/* Level 1: Summary + insight — always visible */}
      <div className="p-3">
        <p className="text-xs text-text-muted mb-1">
          {evidenceStructured?.consistency
            ? `${consistencyLabel[evidenceStructured.consistency]}`
            : '证据'}
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">{evidence}</p>
        {insight && (
          <p className="text-sm text-text-primary leading-relaxed mt-2 italic border-l-2 border-accent-gold/40 pl-2.5">
            {insight}
          </p>
        )}

        {/* Level toggle buttons */}
        <div className="flex gap-2 mt-3">
          {evidenceStructured?.quotes && evidenceStructured.quotes.length > 0 && (
            <button
              onClick={() => setLevel(level === 2 ? 1 : 2)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                level >= 2
                  ? 'bg-accent-teal/20 text-accent-teal'
                  : 'bg-white/5 text-text-muted hover:bg-white/10'
              }`}
            >
              查看具体引用
            </button>
          )}
          {onRefine && (
            <button
              onClick={() => onRefine(dimKey, dimLabel, confidence)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-muted
                hover:bg-accent-gold/10 hover:text-accent-gold transition-colors"
            >
              提升确信度
            </button>
          )}
          {onDisagree && (
            <button
              onClick={() => onDisagree(dimKey, dimLabel)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-muted
                hover:bg-red-400/10 hover:text-red-400 transition-colors"
            >
              这不完全对
            </button>
          )}
        </div>
      </div>

      {/* Level 2: Specific quotes */}
      {level >= 2 && evidenceStructured?.quotes && (
        <div className="px-3 pb-3 border-t border-text-muted/10">
          <p className="text-[11px] text-text-muted mt-2 mb-2">证据来源</p>
          <div className="space-y-2">
            {evidenceStructured.quotes.map((q, i) => (
              <div key={i} className="bg-bg-primary/50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-accent-teal/80">
                    {q.situation}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    第{q.turnIndex + 1}轮
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {q.signal}
                </p>
                <p className="text-[11px] text-text-muted mt-1 italic">
                  你说："{q.userSaid}"
                </p>
              </div>
            ))}
          </div>

          {/* Level 3 entry */}
          <button
            onClick={() => setLevel(level === 3 ? 2 : 3)}
            className={`text-xs px-2.5 py-1 rounded-full mt-2 transition-colors ${
              level >= 3
                ? 'bg-accent-gold/15 text-accent-gold'
                : 'bg-white/5 text-text-muted hover:bg-white/10'
            }`}
          >
            反例检查
          </button>
        </div>
      )}

      {/* Level 3: Counter-example check */}
      {level >= 3 && (
        <div className="px-3 pb-3 border-t border-text-muted/10">
          <p className="text-xs text-text-secondary leading-relaxed mt-2">
            但你真的在所有情况下都这样吗？
          </p>
          <p className="text-xs text-text-muted leading-relaxed mt-1">
            有没有某些人、某些场景下，你的反应是不同的？如果这个判断让你觉得不太对，可以进一步探索。
          </p>
          {onRefine && (
            <button
              onClick={() => onRefine(dimKey, dimLabel, confidence)}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg
                bg-accent-gold/15 text-accent-gold hover:bg-accent-gold/25 transition-colors"
            >
              重新探索这个方向 →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
