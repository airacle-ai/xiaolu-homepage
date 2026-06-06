import type { Goal } from '../types'
import { pickQuote } from '../presets'

interface Props {
  goal: Goal
  onClose: () => void
}

export default function ShareCard({ goal, onClose }: Props) {
  const totalCells = Math.max(1, Math.ceil(goal.targetAmount / goal.unitAmount))
  const litCells = Math.min(totalCells, Math.floor(goal.savedAmount / goal.unitAmount))
  const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const quote = pickQuote(litCells + goal.title.length)

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 className="modal-title">我的小红书分享卡</h3>

        <div className="share-wrap" style={{ padding: 0 }}>
          <div className="share-card">
            <img className="share-image" src={goal.image} alt="" />
            <h2 className="share-title">{goal.title}</h2>
            <div className="share-progress-text">
              我已经点亮了 <strong>{litCells} / {totalCells}</strong> 格
            </div>
            <div className="share-bar">
              <div className="share-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="share-money">
              <span>已存 ¥{goal.savedAmount.toLocaleString()}</span>
              <span>{remaining > 0 ? `还差 ¥${remaining.toLocaleString()}` : '已经拥有 🎉'}</span>
            </div>
            <div className="share-quote">{quote}</div>
            <div className="share-brand">慢 · 慢 · 拥 · 有</div>
          </div>

          <div className="share-tip">长按图片保存，或截图分享给朋友 ✨</div>
        </div>

        <div className="spacer-md" />
        <button className="btn btn-ghost btn-block" onClick={onClose}>完成</button>
      </div>
    </div>
  )
}
