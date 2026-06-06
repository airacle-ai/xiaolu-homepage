import { useState } from 'react'

interface Props {
  unitAmount: number
  remaining: number
  onClose: () => void
  onSubmit: (amount: number, note?: string) => void
}

export default function SaveRecordModal({ unitAmount, remaining, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState<string>(String(unitAmount))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const value = parseFloat(amount) || 0
  const cellsToLight = unitAmount > 0 ? Math.floor(value / unitAmount) : 0

  function handleSubmit() {
    if (value <= 0) return setError('存入金额要大于 0')
    onSubmit(value, note)
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 className="modal-title">存一笔</h3>

        <div className="field">
          <label className="field-label">这次存入（元）</label>
          <input
            className="field-input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError('') }}
            autoFocus
          />
          <div className="field-hint">
            {value > 0 && cellsToLight > 0
              ? `大约可以点亮 ${cellsToLight} 格 ✨`
              : `每格 ¥${unitAmount}，还差 ¥${remaining.toLocaleString()}`}
          </div>
        </div>

        <div className="field">
          <label className="field-label">备注（可选）</label>
          <input
            className="field-input"
            placeholder="例如：少喝两杯奶茶"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={30}
          />
        </div>

        {error && <div className="field-error">{error}</div>}

        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>点亮它</button>
        </div>
      </div>
    </div>
  )
}
