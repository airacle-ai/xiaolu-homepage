import { useMemo, useState } from 'react'
import type { Category, Goal } from '../types'
import { computeStreak, createRecord, deriveCells, manualCycleReset } from '../storage'
import { CATEGORY_MAP } from '../presets'
import SaveRecordModal from './SaveRecordModal'
import ShareCard from './ShareCard'
import EditGoalModal from './EditGoalModal'
import CategoryPie from './CategoryPie'

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
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  // save: 新点亮的格子 / spend: 新熄灭的格子（在格子轴上的索引区间）
  const [animRange, setAnimRange] = useState<{ from: number; to: number } | null>(null)

  const { totalCells, consumed, litCells, isDone, isSpend } = useMemo(
    () => deriveCells(goal),
    [goal],
  )
  const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
  const remainingAmount = Math.max(0, goal.targetAmount - goal.savedAmount)
  const streak = useMemo(() => computeStreak(goal), [goal])
  const isMonthly = isSpend && !!goal.cycleResetDay

  const cols = totalCells <= 25 ? 5 : totalCells <= 49 ? 7 : totalCells <= 64 ? 8 : 10

  function handleSave(amount: number, note?: string, category?: Category) {
    const prevConsumed = consumed
    const newSaved = Math.min(goal.targetAmount, goal.savedAmount + amount)
    const newConsumed = Math.min(totalCells, Math.floor(newSaved / goal.unitAmount))
    const record = createRecord(amount, note, category)
    const updated: Goal = {
      ...goal,
      savedAmount: newSaved,
      records: [...goal.records, record],
      updatedAt: Date.now(),
    }
    onUpdate(updated)
    setShowSave(false)
    if (newConsumed > prevConsumed) {
      // save 模式：新点亮的是 [prev, new) 区间，UI 索引就是这个区间
      // spend 模式：新熄灭的是 [totalCells - new, totalCells - prev) —— 因为 lit 是从尾向前消失
      const range = isSpend
        ? { from: totalCells - newConsumed, to: totalCells - prevConsumed }
        : { from: prevConsumed, to: newConsumed }
      setAnimRange(range)
      setTimeout(() => setAnimRange(null), 1300)
    }
  }

  function handleEdit(patch: Partial<Goal>) {
    const updated: Goal = { ...goal, ...patch, updatedAt: Date.now() }
    if (patch.targetAmount && updated.savedAmount > updated.targetAmount) {
      updated.savedAmount = updated.targetAmount
    }
    onUpdate(updated)
    setShowEdit(false)
  }

  // —— spend 模式独有的派生 ——
  const remainingForSpend = Math.max(0, goal.targetAmount - goal.savedAmount)
  const totalSpent = goal.savedAmount
  const consumedRecords = isSpend ? goal.records.filter((r) => r.category) : []

  return (
    <div>
      <div className="detail-hero">
        <button className="detail-back" onClick={onBack} aria-label="返回">←</button>
        <img src={goal.image} alt="" />
      </div>

      <div className="detail-body">
        <h2 className="detail-title">
          {goal.title}
          <span className={`mode-badge ${isSpend ? 'spend' : 'save'}`}>
            {isSpend ? (isMonthly ? '🌿 月预算' : '🌿 预算') : '🌷 目标'}
          </span>
          {streak >= 2 && (
            <span className={`streak-chip ${isSpend ? 'spend' : ''}`}>
              🔥 已连续 {streak} 天
            </span>
          )}
          {isDone && <span className={`done-tag ${isSpend ? 'spend' : ''}`}>
            {isSpend ? '全部花完' : '已拥有'}
          </span>}
        </h2>

        {isMonthly && (
          <div className="cycle-row">
            <div>
              每月 <strong>{goal.cycleResetDay}</strong> 号归零 ·
              本期起于 {goal.cycleStartedAt ? new Date(goal.cycleStartedAt).toLocaleDateString() : '—'}
            </div>
            <button
              className="cycle-link"
              onClick={() => setShowConfirmReset(true)}
            >
              立即重置
            </button>
          </div>
        )}

        {isDone && (
          <div className={`done-banner ${isSpend ? 'spend' : ''}`}>
            <div className="done-banner-title">
              {isSpend ? '🌱 这份预算已花完' : '🎉 你已经拥有它了'}
            </div>
            <div className="done-banner-sub">
              {isSpend
                ? '记录还在，要不要复制一份开启下一份？'
                : '恭喜你，一格一格点亮的小目标，终于完成了'}
            </div>
          </div>
        )}

        <div className="detail-stats">
          <div className="detail-amount-row">
            <span className={`detail-amount-saved ${isSpend ? 'spend' : ''}`}>
              ¥{(isSpend ? remainingForSpend : goal.savedAmount).toLocaleString()}
            </span>
            <span className="detail-amount-target">
              {isSpend
                ? `还能花 · 总预算 ¥${goal.targetAmount.toLocaleString()}`
                : `/ ¥${goal.targetAmount.toLocaleString()}`}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${isSpend ? 'spend' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="detail-info-row">
            <span>
              {isSpend
                ? `已花 ¥${totalSpent.toLocaleString()}`
                : isDone
                  ? '已经买下啦'
                  : `还差 ¥${remainingAmount.toLocaleString()}`}
            </span>
            <span>{pct.toFixed(1)}%</span>
          </div>
        </div>

        <div className="cells-section">
          <div className="cells-header">
            <span className="cells-title">
              {isSpend ? '守住格子板' : '点亮格子板'}
            </span>
            <span className="cells-count">
              {isSpend
                ? `还剩 ${litCells} / ${totalCells} 格`
                : `${litCells} / ${totalCells}`}
            </span>
          </div>
          <div
            className="cells-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: totalCells }).map((_, i) => {
              const lit = isSpend ? i < litCells : i < litCells
              const inAnim = animRange && i >= animRange.from && i < animRange.to
              const cellClass = isSpend
                ? 'cell' + (lit ? ' spend-lit' : '') + (inAnim ? ' just-dimmed' : '')
                : 'cell' + (lit ? ' lit' : '') + (inAnim ? ' just-lit shimmer' : '')
              const delayIdx = animRange
                ? isSpend
                  ? animRange.to - 1 - i  // spend 模式按从后向前的次序错峰
                  : i - animRange.from
                : 0
              return (
                <div
                  key={i}
                  className={cellClass}
                  style={inAnim ? { animationDelay: `${delayIdx * 60}ms` } : undefined}
                />
              )
            })}
          </div>
        </div>

        <div className="detail-actions">
          <button
            className={`btn ${isSpend ? 'btn-spend' : 'btn-primary'}`}
            onClick={() => setShowSave(true)}
            disabled={isDone}
          >
            {isDone
              ? (isSpend ? '🌿 已经花完' : '✨ 已经拥有')
              : (isSpend ? '花一笔 · 熄灭一格' : '存一笔 · 点亮一格')}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowShare(true)}>
            生成分享图
          </button>
          <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>
            编辑{isSpend ? '预算' : '目标'}
          </button>
        </div>

        <div className="row-between" style={{ marginBottom: 16 }}>
          <span className="text-mute">每格 ¥{goal.unitAmount}</span>
          <button className="btn btn-danger btn-sm" onClick={() => setShowConfirmDelete(true)}>
            删除{isSpend ? '预算' : '目标'}
          </button>
        </div>

        {/* —— v0.3: 历史周期 —— */}
        {isMonthly && goal.archivedCycles && goal.archivedCycles.length > 0 && (
          <div className="records-section">
            <div
              className="records-title"
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={() => setShowHistory((v) => !v)}
            >
              <span>已归档周期（{goal.archivedCycles.length}）</span>
              <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 400 }}>
                {showHistory ? '收起 ▲' : '展开 ▼'}
              </span>
            </div>
            {showHistory && (
              <div className="archive-list">
                {[...goal.archivedCycles].reverse().map((cyc, i) => (
                  <div key={i} className="archive-item">
                    <span className="archive-period">
                      {new Date(cyc.startedAt).toLocaleDateString()} → {new Date(cyc.endedAt).toLocaleDateString()}
                      <span style={{ color: 'var(--ink-mute)', marginLeft: 8 }}>
                        {cyc.recordCount} 笔
                      </span>
                    </span>
                    <span className="archive-amount">¥{cyc.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* spend 模式：分类饼图 */}
        {isSpend && consumedRecords.length > 0 && <CategoryPie records={goal.records} />}

        <div className="records-section">
          <div className="records-title">
            {isSpend ? '花销记录' : '存钱记录'}（{goal.records.length}）
          </div>
          {goal.records.length === 0 ? (
            <div className="text-mute" style={{ padding: '12px 0' }}>
              {isSpend ? '还没有花销记录，希望越久越好 🌿' : '还没有记录，第一笔由你开始 ✨'}
            </div>
          ) : (
            [...goal.records].reverse().map((r) => {
              const cat = r.category ? CATEGORY_MAP[r.category] : null
              return (
                <div key={r.id} className="record-item">
                  <div className="record-info">
                    <span className="record-note">
                      {cat && <span style={{ marginRight: 4 }}>{cat.emoji}</span>}
                      {r.note || (isSpend ? '花了一笔' : '存了一笔')}
                      {cat && (
                        <span
                          style={{
                            fontSize: 10,
                            color: cat.color,
                            marginLeft: 6,
                            fontWeight: 500,
                          }}
                        >
                          {cat.label}
                        </span>
                      )}
                    </span>
                    <span className="record-date">{formatDateTime(r.createdAt)}</span>
                  </div>
                  <span
                    className="record-amount"
                    style={isSpend ? { color: '#5C7A5E' } : undefined}
                  >
                    {isSpend ? '−' : '+'}¥{r.amount.toLocaleString()}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showSave && (
        <SaveRecordModal
          direction={isSpend ? 'spend' : 'save'}
          unitAmount={goal.unitAmount}
          remaining={isSpend ? remainingForSpend : remainingAmount}
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
      {showConfirmReset && (
        <div className="modal-mask modal-center" onClick={() => setShowConfirmReset(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">立即重置本期？</h3>
            <div className="text-mute" style={{ textAlign: 'center' }}>
              当前周期会被归档保留（不会删除），并开始新的一周期
            </div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirmReset(false)}>取消</button>
              <button
                className="btn btn-spend"
                onClick={() => {
                  onUpdate(manualCycleReset(goal))
                  setShowConfirmReset(false)
                }}
              >
                重置并开新周期
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="modal-mask modal-center" onClick={() => setShowConfirmDelete(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              确认删除「{goal.title}」？
            </h3>
            <div className="text-mute" style={{ textAlign: 'center' }}>
              删除后无法恢复，所有记录会一起消失
            </div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirmDelete(false)}>
                再想想
              </button>
              <button
                className={`btn ${isSpend ? 'btn-spend' : 'btn-primary'}`}
                onClick={() => onDelete(goal.id)}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
