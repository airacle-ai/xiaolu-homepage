import { useMemo, useState } from 'react'

// Canonical fill order — interleaves categories so backfilled dots look visually balanced.
const FILL_ORDER = [
  'info_processing', 'truth_vs_kindness', 'attachment_style', 'suppressed_expression',
  'uncertainty_response', 'freedom_vs_belonging', 'intimacy_language', 'aspired_identity',
  'conflict_handling', 'fairness_vs_care', 'boundary_style', 'escape_direction',
  'expression_thinking', 'present_vs_future', 'social_energy', 'desired_role',
  'abstraction_level', 'depth_vs_breadth', 'conflict_repair',
]

// Turn-count-based baseline: 2 answers → 1 dot, gradually up to 19 by turn 17.
// Guarantees visible progression even when the model forgets [DIMS:] markers.
function baselineFromTurns(turnCount: number): number {
  if (turnCount < 2) return 0
  return Math.min(19, Math.max(0, Math.round((turnCount - 1) * 19 / 16)))
}

// 19 维度按 4 大类分组
const DIMENSION_GROUPS = [
  {
    name: '思维方式',
    color: '#4ecdc4',
    dimensions: [
      { key: 'info_processing', label: '信息处理' },
      { key: 'uncertainty_response', label: '不确定性应对' },
      { key: 'conflict_handling', label: '冲突处理' },
      { key: 'expression_thinking', label: '表达思考' },
      { key: 'abstraction_level', label: '抽象层级' },
    ],
  },
  {
    name: '价值观',
    color: '#f5c542',
    dimensions: [
      { key: 'truth_vs_kindness', label: '真实vs善意' },
      { key: 'freedom_vs_belonging', label: '自由vs归属' },
      { key: 'fairness_vs_care', label: '公平vs关怀' },
      { key: 'present_vs_future', label: '现在vs未来' },
      { key: 'depth_vs_breadth', label: '深度vs广度' },
    ],
  },
  {
    name: '关系模式',
    color: '#c084fc',
    dimensions: [
      { key: 'attachment_style', label: '依恋风格' },
      { key: 'intimacy_language', label: '亲密语言' },
      { key: 'boundary_style', label: '边界风格' },
      { key: 'social_energy', label: '社交能量' },
      { key: 'conflict_repair', label: '冲突修复' },
    ],
  },
  {
    name: '未完成的自我',
    color: '#ff6b6b',
    dimensions: [
      { key: 'suppressed_expression', label: '被压抑的表达' },
      { key: 'aspired_identity', label: '向往的身份' },
      { key: 'escape_direction', label: '逃离方向' },
      { key: 'desired_role', label: '渴望角色' },
    ],
  },
]

// 星座布局：19 个点的位置（在 100x40 的 SVG 坐标中）
const DOT_POSITIONS: Record<string, [number, number]> = {
  // 思维方式 - 左上区域
  info_processing: [12, 8],
  uncertainty_response: [22, 12],
  conflict_handling: [8, 18],
  expression_thinking: [18, 22],
  abstraction_level: [28, 6],
  // 价值观 - 右上区域
  truth_vs_kindness: [42, 8],
  freedom_vs_belonging: [52, 14],
  fairness_vs_care: [38, 18],
  present_vs_future: [48, 6],
  depth_vs_breadth: [58, 10],
  // 关系模式 - 左下区域
  attachment_style: [68, 8],
  intimacy_language: [78, 14],
  boundary_style: [72, 20],
  social_energy: [64, 16],
  conflict_repair: [82, 8],
  // 未完成的自我 - 右下区域
  suppressed_expression: [88, 14],
  aspired_identity: [94, 8],
  escape_direction: [90, 22],
  desired_role: [96, 18],
}

export interface ProgressData {
  [dimensionKey: string]: boolean
}

interface Props {
  progress: ProgressData
  turnCount: number
}

export default function ProgressIndicator({ progress, turnCount }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Layer the turn-count baseline on top of the model-marked dots.
  // Model markers always win (they represent real signal); the baseline only fills gaps
  // so the user sees steady progress even when markers are sparse.
  const effectiveProgress = useMemo<ProgressData>(() => {
    const out: ProgressData = { ...progress }
    const currentCount = FILL_ORDER.filter((k) => out[k]).length
    const target = Math.max(currentCount, baselineFromTurns(turnCount))
    let remaining = target - currentCount
    for (const k of FILL_ORDER) {
      if (remaining <= 0) break
      if (!out[k]) {
        out[k] = true
        remaining--
      }
    }
    return out
  }, [progress, turnCount])

  const coveredCount = Object.values(effectiveProgress).filter(Boolean).length

  return (
    <div>
      {/* Compact constellation view */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center gap-3"
      >
        <svg viewBox="0 0 100 30" className="flex-1 h-7">
          {DIMENSION_GROUPS.map((group) =>
            group.dimensions.map((dim) => {
              const pos = DOT_POSITIONS[dim.key]
              const active = effectiveProgress[dim.key]
              return (
                <g key={dim.key}>
                  {active && (
                    <circle
                      cx={pos[0]}
                      cy={pos[1]}
                      r="3"
                      fill={group.color}
                      opacity="0.2"
                    />
                  )}
                  <circle
                    cx={pos[0]}
                    cy={pos[1]}
                    r="1.5"
                    fill={active ? group.color : '#333840'}
                    className={active ? 'transition-all duration-700' : ''}
                  />
                </g>
              )
            })
          )}
        </svg>
        <span className="text-xs text-text-muted whitespace-nowrap">
          {coveredCount}/19
        </span>
      </button>

      {/* Expanded detail view */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {DIMENSION_GROUPS.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-xs text-text-secondary">
                  {group.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 ml-4">
                {group.dimensions.map((dim) => (
                  <span
                    key={dim.key}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      effectiveProgress[dim.key]
                        ? 'bg-white/10 text-text-primary'
                        : 'bg-white/5 text-text-muted'
                    }`}
                  >
                    {dim.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { DIMENSION_GROUPS }
