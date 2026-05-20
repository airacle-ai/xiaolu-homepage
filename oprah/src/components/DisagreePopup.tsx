import { useNavigate } from 'react-router-dom'

interface DisagreePopupProps {
  dimKey: string
  dimLabel: string
  onClose: () => void
  onRetryAll: () => void
}

export default function DisagreePopup({ dimKey, dimLabel, onClose, onRetryAll }: DisagreePopupProps) {
  const navigate = useNavigate()

  const handleLightFix = () => {
    // Navigate to chat for a quick 3-round refinement on this dimension
    navigate('/chat', {
      state: {
        refineKey: dimKey,
        refineLabel: dimLabel,
        mode: 'light_fix',
      },
    })
  }

  const handleDeepRetest = () => {
    // Navigate to chat for a full refinement on this dimension
    navigate('/chat', {
      state: {
        refineKey: dimKey,
        refineLabel: dimLabel,
      },
    })
  }

  const handleFullRetry = () => {
    onRetryAll()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
        bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm
          p-6 border border-text-muted/15 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-text-primary">
            "{dimLabel}"——你觉得不太对？
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          没关系，人有复杂的一面。你想怎么调整？
        </p>

        <div className="space-y-3">
          {/* Option A: Light fix */}
          <button
            onClick={handleLightFix}
            className="w-full text-left p-3 rounded-xl bg-accent-teal/5 border border-accent-teal/20
              hover:bg-accent-teal/10 transition-colors"
          >
            <p className="text-sm font-medium text-text-primary mb-0.5">
              快速调整
            </p>
            <p className="text-xs text-text-muted">
              聊 2-3 轮，看看是不是有其他更贴近的解释
            </p>
          </button>

          {/* Option B: Deep retest */}
          <button
            onClick={handleDeepRetest}
            className="w-full text-left p-3 rounded-xl bg-accent-gold/5 border border-accent-gold/20
              hover:bg-accent-gold/10 transition-colors"
          >
            <p className="text-sm font-medium text-text-primary mb-0.5">
              深度重新探索
            </p>
            <p className="text-xs text-text-muted">
              围绕这个方向重新深入对话，可能会完全修正判断
            </p>
          </button>

          {/* Option C: Full retry */}
          <button
            onClick={handleFullRetry}
            className="w-full text-left p-3 rounded-xl bg-red-400/5 border border-red-400/15
              hover:bg-red-400/10 transition-colors"
          >
            <p className="text-sm font-medium text-text-primary mb-0.5">
              完全重来
            </p>
            <p className="text-xs text-text-muted">
              保留当前画像作为历史版本，重新开始对话生成新的画像
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
