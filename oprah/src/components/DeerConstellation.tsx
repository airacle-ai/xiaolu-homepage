/**
 * DeerConstellation — decorative star-field / constellation background component.
 * Renders an animated SVG particle field using a fixed seed for the "deer" asterism.
 *
 * Currently a visual-only placeholder; interaction and real constellation data
 * will be added in a future iteration.
 */

const STARS = [
  { cx: 48, cy: 30, r: 1.5 }, { cx: 72, cy: 18, r: 1.2 },
  { cx: 96, cy: 36, r: 1.8 }, { cx: 120, cy: 22, r: 1.0 },
  { cx: 60, cy: 55, r: 1.3 }, { cx: 84, cy: 48, r: 1.6 },
  { cx: 108, cy: 60, r: 1.1 }, { cx: 40, cy: 70, r: 1.4 },
  { cx: 132, cy: 44, r: 1.2 }, { cx: 76, cy: 78, r: 1.7 },
]

const LINES = [
  [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [5, 9], [7, 4], [8, 2],
]

interface Props {
  width?: number
  height?: number
  className?: string
  animated?: boolean
}

export default function DeerConstellation({
  width = 180,
  height = 120,
  className = '',
  animated = true,
}: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 120"
      className={className}
      aria-hidden="true"
    >
      {/* Constellation lines */}
      {LINES.map(([a, b], i) => (
        <line
          key={i}
          x1={STARS[a].cx} y1={STARS[a].cy}
          x2={STARS[b].cx} y2={STARS[b].cy}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={0.6}
        />
      ))}

      {/* Stars */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="currentColor" opacity={0.8}>
          {animated && (
            <animate
              attributeName="opacity"
              values="0.8;0.3;0.8"
              dur={`${2.4 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}
    </svg>
  )
}
