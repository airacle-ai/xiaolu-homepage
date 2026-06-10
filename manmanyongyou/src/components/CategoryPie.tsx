import type { SavingRecord } from '../types'
import { CATEGORIES, CATEGORY_MAP } from '../presets'

interface Props {
  records: SavingRecord[]
}

// 把 records 按 category 聚合（无 category 的归到 other），按金额降序返回
function aggregate(records: SavingRecord[]) {
  const sum: Record<string, number> = {}
  for (const r of records) {
    const key = r.category || 'other'
    sum[key] = (sum[key] || 0) + r.amount
  }
  const total = Object.values(sum).reduce((a, b) => a + b, 0)
  const slices = CATEGORIES
    .map((c) => ({ ...c, value: c.value, amount: sum[c.value] || 0 }))
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  return { slices, total }
}

// 给定圆心 + 半径 + 弧度，输出 SVG path
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0)
  const y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1)
  const y1 = cy + r * Math.sin(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
}

export default function CategoryPie({ records }: Props) {
  const { slices, total } = aggregate(records)
  if (slices.length === 0) return null

  // 单分类时直接画整圆
  let cursor = -Math.PI / 2
  const paths = slices.map((s) => {
    const angle = (s.amount / total) * Math.PI * 2
    const next = cursor + angle
    const d =
      slices.length === 1
        ? `M 55 5 A 50 50 0 1 1 54.99 5 Z` // full circle hack
        : arcPath(55, 55, 50, cursor, next)
    cursor = next
    return { ...s, d }
  })

  return (
    <div className="pie-section">
      <div className="records-title" style={{ marginBottom: 14 }}>
        花在了哪里
      </div>
      <div className="pie-row">
        <svg className="pie-svg" viewBox="0 0 110 110">
          {paths.map((p) => (
            <path key={p.value} d={p.d} fill={CATEGORY_MAP[p.value].color} />
          ))}
          {/* 内圆制造甜甜圈感 */}
          <circle cx="55" cy="55" r="22" fill="#FFFFFF" />
          <text
            x="55"
            y="58"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#2A2622"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            ¥{total.toLocaleString()}
          </text>
        </svg>
        <div className="pie-legend">
          {paths.map((p) => (
            <div key={p.value} className="pie-legend-item">
              <span
                className="pie-legend-swatch"
                style={{ background: CATEGORY_MAP[p.value].color }}
              />
              <span>{p.emoji} {p.label}</span>
              <span className="pie-legend-amount">¥{p.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
