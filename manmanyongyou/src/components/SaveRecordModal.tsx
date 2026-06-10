import { useState } from 'react'
import type { Category, Direction } from '../types'
import { CATEGORIES } from '../presets'

interface Props {
  direction: Direction
  unitAmount: number
  remaining: number   // save: 还差多少 / spend: 还剩多少可花
  onClose: () => void
  onSubmit: (amount: number, note?: string, category?: Category) => void
}

export default function SaveRecordModal({
  direction,
  unitAmount,
  remaining,
  onClose,
  onSubmit,
}: Props) {
  const isSpend = direction === 'spend'
  const [amount, setAmount] = useState<string>(String(unitAmount))
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Category | undefined>(undefined)
  const [error, setError] = useState('')

  const value = parseFloat(amount) || 0
  const cellsAffected = unitAmount > 0 ? Math.floor(value / unitAmount) : 0

  function handleSubmit() {
    if (value <= 0) return setError(isSpend ? '花费金额要大于 0' : '存入金额要大于 0')
    onSubmit(value, note, isSpend ? category : undefined)
  }

  const hint =
    value > 0 && cellsAffected > 0
      ? isSpend
        ? `大约会熄灭 ${cellsAffected} 格 🌿`
        : `大约可以点亮 ${cellsAffected} 格 ✨`
      : isSpend
        ? `每格 ¥${unitAmount}，还剩 ¥${remaining.toLocaleString()} 可花`
        : `每格 ¥${unitAmount}，还差 ¥${remaining.toLocaleString()}`

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 className="modal-title">{isSpend ? '花一笔' : '存一笔'}</h3>

        <div className="field">
          <label className="field-label">{isSpend ? '这次花掉（元）' : '这次存入（元）'}</label>
          <input
            className="field-input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError('') }}
            autoFocus
          />
          <div className="field-hint">{hint}</div>
        </div>

        <div className="field">
          <label className="field-label">备注（可选）</label>
          <input
            className="field-input"
            placeholder={isSpend ? '例如：午餐 / 打车回家' : '例如：少喝两杯奶茶'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={30}
          />
        </div>

        {isSpend && (
          <div className="field">
            <label className="field-label">花在了哪里（可选）</label>
            <div className="cat-chips">
              {CATEGORIES.map((c) => {
                const active = category === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    className={`cat-chip ${active ? 'active' : ''}`}
                    style={active ? { background: c.color } : undefined}
                    onClick={() => setCategory(active ? undefined : c.value)}
                  >
                    <span>{c.emoji}</span> {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && <div className="field-error">{error}</div>}

        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            className={`btn ${isSpend ? 'btn-spend' : 'btn-primary'}`}
            onClick={handleSubmit}
          >
            {isSpend ? '熄灭它' : '点亮它'}
          </button>
        </div>
      </div>
    </div>
  )
}
