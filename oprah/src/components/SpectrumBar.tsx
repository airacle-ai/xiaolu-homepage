interface Props {
  value: number // -100 to 100
  leftLabel: string
  rightLabel: string
}

export default function SpectrumBar({ value, leftLabel, rightLabel }: Props) {
  // Convert -100~100 to 0~100 percentage
  const position = (value + 100) / 2

  return (
    <div className="mt-2 mb-1">
      <div className="relative h-2 bg-white/10 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent-gold shadow-[0_0_8px_rgba(245,197,66,0.4)] transition-all"
          style={{ left: `calc(${position}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-text-muted">{leftLabel}</span>
        <span className="text-[11px] text-text-muted">{rightLabel}</span>
      </div>
    </div>
  )
}
