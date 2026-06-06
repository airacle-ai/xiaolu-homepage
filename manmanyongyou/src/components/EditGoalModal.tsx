import { useState } from 'react'
import type { Goal } from '../types'

interface Props {
  goal: Goal
  onClose: () => void
  onSave: (patch: Partial<Goal>) => void
}

export default function EditGoalModal({ goal, onClose, onSave }: Props) {
  const [title, setTitle] = useState(goal.title)
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount))
  const [unitAmount, setUnitAmount] = useState(String(goal.unitAmount))
  const [image, setImage] = useState(goal.image)
  const [error, setError] = useState('')

  function handleSave() {
    const t = parseFloat(targetAmount) || 0
    const u = parseFloat(unitAmount) || 0
    if (!title.trim()) return setError('目标名称不能为空')
    if (t <= 0) return setError('目标金额要大于 0')
    if (u <= 0) return setError('每格金额要大于 0')
    if (u > t) return setError('每格金额不能大于目标金额')
    if (Math.ceil(t / u) > 100) return setError('总格子数不能超过 100')
    onSave({ title: title.trim(), targetAmount: t, unitAmount: u, image: image.trim() || goal.image })
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 className="modal-title">编辑目标</h3>

        <div className="field">
          <label className="field-label">目标名称</label>
          <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">目标金额</label>
          <input className="field-input" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">每格金额</label>
          <input className="field-input" type="number" value={unitAmount} onChange={(e) => setUnitAmount(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">图片链接</label>
          <input className="field-input" value={image} onChange={(e) => setImage(e.target.value)} />
        </div>

        {error && <div className="field-error">{error}</div>}

        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
