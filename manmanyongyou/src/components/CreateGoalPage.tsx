import { useMemo, useState } from 'react'
import type { Goal, Theme } from '../types'
import { THEMES, PRESET_IMAGES } from '../presets'
import { uid } from '../storage'

interface Props {
  onCancel: () => void
  onCreate: (goal: Goal) => void
}

export default function CreateGoalPage({ onCancel, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState<string>('')
  const [unitAmount, setUnitAmount] = useState<string>('')
  const [theme, setTheme] = useState<Theme>('tech')
  const [imageUrl, setImageUrl] = useState<string>(PRESET_IMAGES.tech[0])
  const [customUrl, setCustomUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  const target = parseFloat(targetAmount) || 0
  const unit = parseFloat(unitAmount) || 0
  const totalCells = unit > 0 && target > 0 ? Math.ceil(target / unit) : 0

  const cellsHint = useMemo(() => {
    if (target <= 0 || unit <= 0) return '设置好金额后会自动计算总格子数'
    if (totalCells > 100) return `当前会有 ${totalCells} 格，太多啦，建议调大每格金额`
    return `总共会有 ${totalCells} 格`
  }, [target, unit, totalCells])

  const presetImages = PRESET_IMAGES[theme]

  function handleSubmit() {
    setError('')
    if (!title.trim()) return setError('给目标起个名字吧')
    if (target <= 0) return setError('目标金额要大于 0')
    if (unit <= 0) return setError('每格金额要大于 0')
    if (unit > target) return setError('每格金额不能大于目标金额')
    if (totalCells > 100) return setError('总格子数不能超过 100，请调大每格金额')

    const finalImage = customUrl.trim() || imageUrl
    const now = Date.now()
    const goal: Goal = {
      id: uid(),
      title: title.trim(),
      targetAmount: target,
      savedAmount: 0,
      unitAmount: unit,
      image: finalImage,
      theme,
      createdAt: now,
      updatedAt: now,
      records: [],
    }
    onCreate(goal)
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn-icon" onClick={onCancel} aria-label="返回">←</button>
        <div className="page-header-title">创建新目标</div>
      </div>

      <div className="form-page">
        <div className="field">
          <label className="field-label">想拥有什么？</label>
          <input
            className="field-input"
            placeholder="例如：买下我的第一台相机"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className="field">
          <label className="field-label">目标金额（元）</label>
          <input
            className="field-input"
            type="number"
            inputMode="decimal"
            placeholder="3000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">每格金额（元）</label>
          <input
            className="field-input"
            type="number"
            inputMode="decimal"
            placeholder="50"
            value={unitAmount}
            onChange={(e) => setUnitAmount(e.target.value)}
          />
          <div className="field-hint">{cellsHint}</div>
        </div>

        <div className="field">
          <label className="field-label">为它选一个主题</label>
          <div className="theme-chips">
            {THEMES.map((t) => (
              <button
                key={t.value}
                className={`theme-chip ${theme === t.value ? 'active' : ''}`}
                onClick={() => {
                  setTheme(t.value)
                  setImageUrl(PRESET_IMAGES[t.value][0])
                  setCustomUrl('')
                }}
                type="button"
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">挑一张让你心动的图</label>
          <div className="image-grid">
            {presetImages.map((url) => (
              <div
                key={url}
                className={`image-tile ${imageUrl === url && !customUrl ? 'active' : ''}`}
                onClick={() => { setImageUrl(url); setCustomUrl('') }}
              >
                <img src={url} alt="" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="spacer-sm" />
          <input
            className="field-input"
            placeholder="或者贴一张你自己的图片链接"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
        </div>

        {error && <div className="field-error">{error}</div>}

        <div className="form-actions">
          <button className="btn btn-primary btn-block" onClick={handleSubmit}>
            把它放进我的愿望清单
          </button>
        </div>
      </div>
    </div>
  )
}
