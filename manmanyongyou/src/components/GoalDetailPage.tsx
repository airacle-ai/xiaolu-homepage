import { useMemo, useState } from 'react'
import type { Goal } from '../types'
import { createRecord } from '../storage'
import SaveRecordModal from './SaveRecordModal'
import ShareCard from './ShareCard'
import EditGoalModal from './EditGoalModal'

interface Props {
  goal: Goal
  onBack: () => void
  onUpdate: (goal: Goal) => void
  onDelete: (id: string) => void
}

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${m}/${day} ${hh}:${mm}`
}

export default function GoalDetailPage({ goal, onBack, onUpdate, onDelete }: Props) {
  const [showSave, setShowSave] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [justLitRange, setJustLitRange] = useState<{ from: number; to: number } | null>(null)

  const totalCells = useMemo(
    () => Math.max(1, Math.ceil(goal.targetAmount / goal.unitAmount)),
    [goal.targetAmount, goal.unitAmount],
  )
  const litCells = Math.min(totalCells, Math.floor(goal.savedAmount / goal.unitAmount))
  const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const isDone = goal.savedAmount >= goal.targetAmount

  // adaptive grid columns
  const cols = totalCells <= 25 ? 5 : totalCells <= 49 ? 7 : totalCells <= 64 ? 8 : 10

  function handleSave(amount: number, note?: string) {
    const prevLit = litCells
    const newSaved = Math.min(goal.targetAmount, goal.savedAmount + amount)
    const newLit = Math.min(totalCells, Math.floor(newSaved / goal.unitAmount))
    const record = createRecord(amount, note)
    const updated: Goal = {
      ...goal,
      savedAmount: newSaved,
      records: [...goal.records, record],
      updatedAt: Date.now(),
    }
    onUpdate(updated)
    setShowSave(false)
    if (newLit > prevLit) {
      setJustLitRange({ from: prevLit, to: newLit })
      setTimeout(() => setJustLitRange(null), 1200)
    }
  }

  function handleEdit(patch: Partial<Goal>) {
    const updated: Goal = { ...goal, ...patch, updatedAt: Date.now() }
    // 重新夹紧 savedAmount
    if (patch.targetAmount && updated.savedAmount > updated.targetAmount) {
      updated.savedAmount = updated.targetAmount
    }
    onUpdate(updated)
    setShowEdit(false)
  }

  return (
    <div>
      <div className="detail-hero">
        <button className="detail-back" onClick={onBack} aria-label="返回">←</button>
        <img src={goal.image} alt="" />
      </div>

      <div className="detail-body">
        <h2 className="detail-title">
          {goal.title}
          {isDone && <span className="done-tag">已拥有</span>}
        </h2>

        {isDone && (
          <div className="done-banner">
            <div className="done-banner-title">🎉 你已经拥有它了</div>
            <div className="done-banner-sub">恭喜你，一格一格点亮的小目标，终于完成了</div>
          </div>
        )}

        <div className="detail-stats">
          <div className="detail-amount-row">
            <span className="detail-amount-saved">¥{goal.savedAmount.toLocaleString()}</span>
            <span className="detail-amount-target">/ ¥{goal.targetAmount.toLocaleString()}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="detail-info-row">
            <span>{isDone ? '已经买下啦' : `还差 ¥${remaining.toLocaleString()}`}</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
        </div>

        <div className="cells-section">
          <div className="cells-header">
            <span className="cells-title">点亮格子板</span>
            <span className="cells-count">{litCells} / {totalCells}</span>
          </div>
          <div className="cells-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const lit = i < litCells
              const justLit =
                justLitRange && i >= justLitRange.from && i < justLitRange.to
              return (
                <div
                  key={i}
                  className={
                    'cell' +
                    (lit ? ' lit' : '') +
                    (justLit ? ' just-lit shimmer' : '')
                  }
                  style={justLit ? { animationDelay: `${(i - justLitRange!.from) * 60}ms` } : undefined}
                />
              )
            })}
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn btn-primary" onClick={() => setShowSave(true)} disabled={isDone}>
            {isDone ? '✨ 已经拥有' : '存一笔 · 点亮一格'}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowShare(true)}>
            生成分享图
          </button>
          <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>
            编辑目标
          </button>
        </div>

        <div className="row-between" style={{ marginBottom: 16 }}>
          <span className="text-mute">每格 ¥{goal.unitAmount}</span>
          <button className="btn btn-danger btn-sm" onClick={() => setShowConfirmDelete(true)}>
            删除目标
          </button>
        </div>

        <div className="records-section">
          <div className="records-title">存钱记录（{goal.records.length}）</div>
          {goal.records.length === 0 ? (
            <div className="text-mute" style={{ padding: '12px 0' }}>
              还没有记录，第一笔由你开始 ✨
            </div>
          ) : (
            [...goal.records].reverse().map((r) => (
              <div key={r.id} className="record-item">
                <div className="record-info">
                  <span className="record-note">{r.note || '存了一笔'}</span>
                  <span className="record-date">{formatDateTime(r.createdAt)}</span>
                </div>
                <span className="record-amount">+¥{r.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {showSave && (
        <SaveRecordModal
          unitAmount={goal.unitAmount}
          remaining={remaining}
          onClose={() => setShowSave(false)}
          onSubmit={handleSave}
        />
      )}
      {showShare && <ShareCard goal={goal} onClose={() => setShowShare(false)} />}
      {showEdit && (
        <EditGoalModal
          goal={goal}
          onClose={() => setShowEdit(false)}
          onSave={handleEdit}
        />
      )}
      {showConfirmDelete && (
        <div className="modal-mask modal-center" onClick={() => setShowConfirmDelete(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">确认删除「{goal.title}」？</h3>
            <div className="text-mute" style={{ textAlign: 'center' }}>
              删除后无法恢复，所有存钱记录会一起消失
            </div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirmDelete(false)}>再想想</button>
              <button className="btn btn-primary" onClick={() => onDelete(goal.id)}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
