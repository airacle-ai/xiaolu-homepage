import { useNavigate } from 'react-router-dom'

interface Props {
  dimensionKey: string
  dimensionLabel: string
  confidence: number
  onClose: () => void
}

export default function ConfidencePopup({ dimensionKey, dimensionLabel, confidence, onClose }: Props) {
  const navigate = useNavigate()

  const handleImprove = () => {
    onClose()
    // Navigate to chat with refinement context
    navigate('/chat', { state: { refineKey: dimensionKey, refineLabel: dimensionLabel } })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-bg-card border border-text-muted/20 rounded-2xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-medium text-text-primary mb-3">什么是确信度？</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          确信度表示 Oprah 对这个维度判断的把握程度。对话中涉及越多相关话题，确信度越高。80% 以上表示判断比较可靠。
        </p>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-text-secondary">{dimensionLabel}</span>
            <span className="text-sm font-mono text-accent-gold">{confidence}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${confidence}%`,
                backgroundColor: confidence >= 80 ? '#4ecdc4' : confidence >= 60 ? '#f5c542' : '#ff6b6b',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleImprove}
          className="w-full py-2.5 rounded-xl bg-accent-teal/20 text-accent-teal text-sm font-medium
            active:scale-[0.98] transition-transform"
        >
          进一步提升确信度 →
        </button>
      </div>
    </div>
  )
}
