interface Props {
  anxietyScore: number  // 0-100
  avoidanceScore: number // 0-100
}

export default function AttachmentChart({ anxietyScore, avoidanceScore }: Props) {
  // Map 0-100 to position in chart (percentage)
  const x = avoidanceScore
  const y = 100 - anxietyScore // flip Y axis (high anxiety = top)

  return (
    <div className="mt-2 mb-1">
      <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-white/5 rounded-lg overflow-hidden">
        {/* Quadrant labels */}
        <span className="absolute top-2 left-2 text-[10px] text-text-muted">焦虑型</span>
        <span className="absolute top-2 right-2 text-[10px] text-text-muted">混乱型</span>
        <span className="absolute bottom-2 left-2 text-[10px] text-text-muted">安全型</span>
        <span className="absolute bottom-2 right-2 text-[10px] text-text-muted">回避型</span>

        {/* Axes */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />

        {/* Axis labels */}
        <span className="absolute -left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-text-muted whitespace-nowrap origin-center translate-x-3">
          焦虑 ↑
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-text-muted translate-y-[-4px]">
          回避 →
        </span>

        {/* User dot */}
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div className="w-full h-full rounded-full bg-accent-gold shadow-[0_0_10px_rgba(245,197,66,0.5)]" />
        </div>
      </div>
    </div>
  )
}
