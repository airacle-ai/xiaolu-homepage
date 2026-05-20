import type { IdentityLabel } from '../lib/supabase'

interface IdentityLabelProps {
  label: IdentityLabel
  matchCode: string
  onCopyCode: () => void
  copied: boolean
}

export default function IdentityLabelHero({ label, matchCode, onCopyCode, copied }: IdentityLabelProps) {
  return (
    <div className="text-center py-6 px-4 border-b border-text-muted/15">
      {/* Primary Identity */}
      <div className="mb-3">
        <span className="text-3xl font-bold text-accent-gold
          [text-shadow:0_0_30px_rgba(245,197,66,0.3)] tracking-wider">
          {label.primary}
        </span>
      </div>

      {/* Modifiers */}
      {label.modifiers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {label.modifiers.map((mod, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full
                bg-accent-teal/15 text-accent-teal border border-accent-teal/30"
            >
              {mod}
            </span>
          ))}
        </div>
      )}

      {/* One-liner */}
      <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto italic">
        "{label.one_liner}"
      </p>

      {/* Match Code - secondary */}
      <div className="mt-4 pt-3 border-t border-text-muted/10">
        <p className="text-[11px] text-text-muted mb-1.5">你的暗号（发给朋友来碰撞）</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg font-mono tracking-[0.25em] text-text-secondary">
            {matchCode}
          </span>
          <button
            onClick={onCopyCode}
            className="text-text-muted hover:text-text-secondary transition-colors p-1"
            title="复制暗号"
          >
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
