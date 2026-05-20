import { useRef, useState, useEffect } from 'react'
import type { CollisionResult, IdentityLabel } from '../lib/supabase'

interface InviteCardProps {
  result: CollisionResult
  userIdentityLabel?: IdentityLabel
  matchCode: string
  onClose: () => void
}

export default function InviteCard({ result, userIdentityLabel, matchCode, onClose }: InviteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const yourLabel = userIdentityLabel?.primary || '探索者'
  const yourModifiers = userIdentityLabel?.modifiers?.join(' · ') || ''
  const friendLabel = result.relationship_type || '未知'

  const rolesForA = result.roles_for_a?.primary?.slice(0, 2).map(r => r.role_name).join(' · ') || ''
  const rolesForB = result.roles_for_b?.primary?.slice(0, 2).map(r => r.role_name).join(' · ') || ''

  useEffect(() => {
    if (!saving || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) { setSaving(false); return }

    const dpr = window.devicePixelRatio || 1
    const width = 400
    const height = 520
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx2d.scale(dpr, dpr)

    // Background
    const bg = ctx2d.createLinearGradient(0, 0, width, height)
    bg.addColorStop(0, '#1a1a2e')
    bg.addColorStop(1, '#16213e')
    ctx2d.fillStyle = bg
    ctx2d.beginPath()
    ctx2d.roundRect(0, 0, width, height, 16)
    ctx2d.fill()

    // Header accent
    const accentGrad = ctx2d.createLinearGradient(0, 0, width, 0)
    accentGrad.addColorStop(0, 'rgba(245,197,66,0.3)')
    accentGrad.addColorStop(0.5, 'rgba(245,197,66,0.05)')
    accentGrad.addColorStop(1, 'rgba(78,205,196,0.3)')
    ctx2d.fillStyle = accentGrad
    ctx2d.fillRect(0, 0, width, 180)

    // Title
    ctx2d.fillStyle = 'rgba(255,255,255,0.4)'
    ctx2d.font = '11px sans-serif'
    ctx2d.textAlign = 'center'
    ctx2d.letterSpacing = '4px'
    ctx2d.fillText('OPRAH 关系名片', width / 2, 30)

    // Two identities
    ctx2d.fillStyle = '#cbd5e1'
    ctx2d.font = '13px sans-serif'
    ctx2d.textAlign = 'center'
    ctx2d.fillText(yourLabel + (yourModifiers ? ' · ' + yourModifiers : ''), width / 2, 70)

    ctx2d.fillStyle = '#f5c542'
    ctx2d.font = '20px serif'
    ctx2d.fillText('×', width / 2, 95)

    ctx2d.fillStyle = '#cbd5e1'
    ctx2d.font = '13px sans-serif'
    ctx2d.fillText(friendLabel, width / 2, 115)

    // Relationship type
    if (result.relationship_type) {
      ctx2d.fillStyle = '#f5c542'
      ctx2d.font = 'bold 22px sans-serif'
      ctx2d.shadowColor = 'rgba(245,197,66,0.3)'
      ctx2d.shadowBlur = 15
      ctx2d.fillText(result.relationship_type, width / 2, 148)
      ctx2d.shadowBlur = 0
    }

    // One-liner
    ctx2d.fillStyle = '#94a3b8'
    ctx2d.font = 'italic 12px sans-serif'
    const line = result.relationship_potential || ''
    const words = line.split('')
    let line1 = ''
    let line2 = ''
    const mid = Math.floor(words.length / 2)
    for (let i = 0; i < words.length; i++) {
      if (i < mid) line1 += words[i]
      else line2 += words[i]
    }
    ctx2d.fillText('"' + line1, width / 2, 175)
    if (line2) ctx2d.fillText(line2 + '"', width / 2, 192)

    // Divider
    ctx2d.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx2d.lineWidth = 1
    ctx2d.beginPath()
    ctx2d.moveTo(20, 210)
    ctx2d.lineTo(width - 20, 210)
    ctx2d.stroke()

    // Roles section
    let y = 235
    ctx2d.fillStyle = 'rgba(255,255,255,0.35)'
    ctx2d.font = '10px sans-serif'
    ctx2d.textAlign = 'left'

    if (rolesForA) {
      ctx2d.fillText('对方之于我', 24, y)
      y += 18
      ctx2d.fillStyle = '#f5c542'
      ctx2d.font = '13px sans-serif'
      ctx2d.fillText(rolesForA, 24, y)
      ctx2d.fillStyle = 'rgba(255,255,255,0.35)'
      ctx2d.font = '10px sans-serif'
      y += 28
    }

    if (rolesForB) {
      ctx2d.fillText('我之于对方', 24, y)
      y += 18
      ctx2d.fillStyle = '#4ecdc4'
      ctx2d.font = '13px sans-serif'
      ctx2d.fillText(rolesForB, 24, y)
      y += 28
    }

    // Divider 2
    ctx2d.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx2d.beginPath()
    ctx2d.moveTo(20, y + 5)
    ctx2d.lineTo(width - 20, y + 5)
    ctx2d.stroke()
    y += 25

    // Match code
    ctx2d.fillStyle = 'rgba(255,255,255,0.35)'
    ctx2d.font = '10px sans-serif'
    ctx2d.fillText('我的暗号', 24, y)
    y += 18
    ctx2d.fillStyle = '#cbd5e1'
    ctx2d.font = '16px monospace'
    ctx2d.fillText(matchCode, 24, y)

    ctx2d.fillStyle = 'rgba(255,255,255,0.25)'
    ctx2d.font = '9px sans-serif'
    ctx2d.textAlign = 'right'
    ctx2d.fillText('来 Oprah 看看我们的关系', width - 24, y)

    // Bottom accent
    const bottomGrad = ctx2d.createLinearGradient(0, 0, width, 0)
    bottomGrad.addColorStop(0, 'rgba(245,197,66,0.2)')
    bottomGrad.addColorStop(0.5, 'rgba(78,205,196,0.1)')
    bottomGrad.addColorStop(1, 'rgba(245,197,66,0.2)')
    ctx2d.fillStyle = bottomGrad
    ctx2d.fillRect(0, height - 3, width, 3)

    // Export
    canvas.toBlob((blob) => {
      setSaving(false)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `oprah-relation-${matchCode}.png`
      a.click()
      URL.revokeObjectURL(url)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 'image/png')
  }, [saving, matchCode])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
        bg-black/70 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visible Card (same design for preview) */}
        <div
          ref={cardRef}
          className="bg-bg-card rounded-2xl overflow-hidden border border-text-muted/15
            shadow-2xl shadow-accent-gold/10"
        >
          <div className="bg-gradient-to-br from-accent-gold/20 via-bg-card to-accent-teal/20 px-5 py-6 text-center">
            <p className="text-xs text-text-muted mb-2 tracking-widest">OPRAH 关系名片</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-right">
                <p className="text-xs text-text-muted mb-0.5">我</p>
                <p className="text-sm font-medium text-text-primary">{yourLabel}</p>
                {yourModifiers && <p className="text-[10px] text-text-muted">{yourModifiers}</p>}
              </div>
              <div className="text-2xl text-accent-gold font-light">×</div>
              <div className="text-left">
                <p className="text-xs text-text-muted mb-0.5">朋友</p>
                <p className="text-sm font-medium text-text-primary">{friendLabel}</p>
              </div>
            </div>
            {result.relationship_type && (
              <div className="mb-3">
                <span className="text-xl font-bold text-accent-gold
                  [text-shadow:0_0_25px_rgba(245,197,66,0.3)] tracking-wider">
                  {result.relationship_type}
                </span>
              </div>
            )}
            <p className="text-sm text-text-secondary italic leading-relaxed max-w-xs mx-auto">
              "{result.relationship_potential}"
            </p>
          </div>

          <div className="px-5 py-4 border-t border-text-muted/10">
            {rolesForA && (
              <div className="mb-3">
                <p className="text-[11px] text-text-muted mb-1">对方之于我</p>
                <p className="text-sm text-accent-gold">{rolesForA}</p>
              </div>
            )}
            {rolesForB && (
              <div>
                <p className="text-[11px] text-text-muted mb-1">我之于对方</p>
                <p className="text-sm text-accent-teal">{rolesForB}</p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-text-muted/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted">我的暗号</p>
                <p className="text-sm font-mono tracking-[0.2em] text-text-secondary">{matchCode}</p>
              </div>
              <p className="text-[10px] text-text-muted max-w-[120px] text-right leading-relaxed">
                来 Oprah 做你自己的画像，看看我们的关系
              </p>
            </div>
          </div>
        </div>

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-text-secondary text-sm
              border border-white/10 active:scale-[0.97] transition-all"
          >
            关闭
          </button>
          <button
            onClick={() => setSaving(true)}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-accent-gold text-bg-primary font-medium text-sm
              active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {saving ? '生成中...' : saved ? '已保存 ✓' : '保存图片'}
          </button>
        </div>
        <p className="text-center text-[11px] text-text-muted mt-2">
          也可以直接截图保存
        </p>
      </div>
    </div>
  )
}
