import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import type { DimensionResult, IdentityLabel } from '../lib/supabase'
import { runAnalysis } from '../lib/analysis'
import SpectrumBar from '../components/SpectrumBar'
import AttachmentChart from '../components/AttachmentChart'
import ConfidencePopup from '../components/ConfidencePopup'
import IdentityLabelHero from '../components/IdentityLabelHero'
import EvidencePanel from '../components/EvidencePanel'
import DisagreePopup from '../components/DisagreePopup'

const DIMENSION_OPTIONS: Record<string, readonly string[]> = {
  info_processing: ['演绎型', '归纳型', '类比型', '直觉型'],
  uncertainty_response: ['分析优先', '行动优先', '框架构建', '直觉跳跃'],
  conflict_handling: ['回避', '对抗', '调和', '整合'],
  expression_thinking: ['想清楚再说', '边说边想', '写作思考', '对话思考'],
  abstraction_level: ['具象型', '抽象型', '层级跳跃型'],
  boundary_style: ['高渗透型', '渐进开放型', '选择性开放型', '高壁垒型'],
  social_energy: ['充电型', '消耗型', '选择性', '情境型'],
  conflict_repair: ['即时修复', '冷处理', '遗忘', '关系重评'],
  attachment_style: ['安全型', '焦虑型', '回避型', '混乱型'],
}

const INTIMACY_OPTIONS = ['语言确认', '质量时间', '行动服务', '知识分享', '共同体验'] as const

export default function MapPage() {
  const { user, setUser } = useUser()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [confidencePopup, setConfidencePopup] = useState<{
    key: string; label: string; confidence: number
  } | null>(null)
  const [disagreePopup, setDisagreePopup] = useState<{
    key: string; label: string
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  const lastAssistantMsg = [...(user?.chat_history || [])]
    .reverse()
    .find((m) => m.role === 'assistant')
  const readyForAnalysis =
    !!user && !user.dimensions && !!lastAssistantMsg?.content.includes('[ANALYSIS_READY]')

  const handleContinueAnalysis = async () => {
    if (!user) return
    setIsAnalyzing(true)
    setAnalyzeError('')
    try {
      const { dimensions, matchCode, identityLabel } = await runAnalysis(user, user.chat_history || [])
      setUser({
        ...user,
        dimensions,
        match_code: matchCode,
        identity_label: identityLabel,
        analysis_versions: [{ version: 1, dimensions, identity_label: identityLabel, created_at: new Date().toISOString() }],
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      console.error('[Oprah] analysis failed:', e)
      setAnalyzeError(`分析失败：${msg}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRetryAll = async () => {
    if (!user) return
    setDisagreePopup(null)
    setIsAnalyzing(true)
    try {
      // Clear current dimensions to trigger fresh analysis
      await runAnalysis(user, user.chat_history || [])
      // Reload by navigating
      navigate('/chat', { replace: true })
    } catch {
      setIsAnalyzing(false)
    }
  }

  // No dimensions yet
  if (!user?.dimensions || !user?.match_code) {
    if (isAnalyzing) {
      return (
        <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-accent-gold/20" />
            <div className="absolute inset-0 rounded-full border-2 border-accent-gold border-t-transparent animate-spin" />
          </div>
          <p className="text-text-secondary text-sm">Oprah 正在分析你的画像...</p>
          <p className="text-text-muted text-xs">可能需要 30-60 秒，请耐心等待</p>
        </div>
      )
    }

    if (readyForAnalysis) {
      return (
        <div className="h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-gold/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5c542" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <p className="text-text-primary mb-1 text-base">你已经聊完了，但分析还没完成</p>
          <p className="text-text-muted text-sm mb-6">上次的分析可能被中断了，点击下方按钮继续</p>
          <button
            onClick={handleContinueAnalysis}
            className="px-6 py-3 rounded-xl bg-accent-gold text-bg-primary font-medium
              active:scale-[0.97] transition-transform"
          >
            继续分析 →
          </button>
          {analyzeError && (
            <p className="text-red-400 text-sm mt-4">{analyzeError}</p>
          )}
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-gold/10 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5c542" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        </div>
        <p className="text-text-secondary mb-1">你的自我地图还没有生成</p>
        <p className="text-text-muted text-sm">完成与 Oprah 的对话后，这里会展示你的全部维度分析</p>
      </div>
    )
  }

  const dim = user.dimensions as DimensionResult
  const identityLabel: IdentityLabel = user.identity_label || {
    primary: '探索者',
    modifiers: [],
    one_liner: dim.overall_portrait?.slice(0, 80) || '',
  }
  const matchCode = user.match_code

  const copyCode = () => {
    navigator.clipboard.writeText(matchCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfClick = (key: string, label: string, confidence: number) => {
    setConfidencePopup({ key, label, confidence })
  }

  const handleDisagree = (key: string, label: string) => {
    setDisagreePopup({ key, label })
  }

  const handleExplore = (key: string, label: string) => {
    // Navigate to chat for focused exploration of this dimension
    navigate('/chat', { state: { refineKey: key, refineLabel: label } })
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Identity Label Hero — replaces old match code section */}
      <IdentityLabelHero
        label={identityLabel}
        matchCode={matchCode}
        onCopyCode={copyCode}
        copied={copied}
      />

      <div className="px-4 py-4 space-y-4">
        {/* Thinking Styles */}
        <DimensionGroup title="思维方式" color="#4ecdc4">
          <DimensionCard
            label="信息处理方向"
            result={dim.thinking_styles.info_processing.result}
            options={DIMENSION_OPTIONS.info_processing}
            evidence={dim.thinking_styles.info_processing.evidence}
            evidenceStructured={dim.thinking_styles.info_processing.evidence_structured}
            insight={dim.thinking_styles.info_processing.insight}
            confidence={dim.thinking_styles.info_processing.confidence}
            dimKey="info_processing"
            dimLabel="信息处理方向"
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <DimensionCard
            label="不确定性应对"
            result={dim.thinking_styles.uncertainty_response.result}
            options={DIMENSION_OPTIONS.uncertainty_response}
            evidence={dim.thinking_styles.uncertainty_response.evidence}
            evidenceStructured={dim.thinking_styles.uncertainty_response.evidence_structured}
            insight={dim.thinking_styles.uncertainty_response.insight}
            confidence={dim.thinking_styles.uncertainty_response.confidence}
            dimKey="uncertainty_response"
            dimLabel="不确定性应对"
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <DimensionCard
            label="冲突处理"
            result={dim.thinking_styles.conflict_handling.result}
            options={DIMENSION_OPTIONS.conflict_handling}
            evidence={dim.thinking_styles.conflict_handling.evidence}
            evidenceStructured={dim.thinking_styles.conflict_handling.evidence_structured}
            insight={dim.thinking_styles.conflict_handling.insight}
            confidence={dim.thinking_styles.conflict_handling.confidence}
            dimKey="conflict_handling"
            dimLabel="冲突处理"
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <DimensionCard
            label="表达与思考"
            result={dim.thinking_styles.expression_thinking.result}
            options={DIMENSION_OPTIONS.expression_thinking}
            evidence={dim.thinking_styles.expression_thinking.evidence}
            evidenceStructured={dim.thinking_styles.expression_thinking.evidence_structured}
            insight={dim.thinking_styles.expression_thinking.insight}
            confidence={dim.thinking_styles.expression_thinking.confidence}
            dimKey="expression_thinking"
            dimLabel="表达与思考"
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <DimensionCard
            label="抽象层级偏好"
            result={dim.thinking_styles.abstraction_level.result}
            options={DIMENSION_OPTIONS.abstraction_level}
            evidence={dim.thinking_styles.abstraction_level.evidence}
            evidenceStructured={dim.thinking_styles.abstraction_level.evidence_structured}
            insight={dim.thinking_styles.abstraction_level.insight}
            confidence={dim.thinking_styles.abstraction_level.confidence}
            dimKey="abstraction_level"
            dimLabel="抽象层级偏好"
            onDisagree={handleDisagree}
          />
        </DimensionGroup>

        {/* Values */}
        <DimensionGroup title="价值观" color="#f5c542">
          <ValueCard label="真实 vs 善意" value={dim.values.truth_vs_kindness}
            leftLabel="真实" rightLabel="善意"
            dimKey="truth_vs_kindness" dimLabel="真实 vs 善意"
            onConfClick={handleConfClick} onDisagree={handleDisagree} onExplore={handleExplore} />
          <ValueCard label="自由 vs 归属" value={dim.values.freedom_vs_belonging}
            leftLabel="自由" rightLabel="归属"
            dimKey="freedom_vs_belonging" dimLabel="自由 vs 归属"
            onConfClick={handleConfClick} onDisagree={handleDisagree} onExplore={handleExplore} />
          <ValueCard label="公平 vs 关怀" value={dim.values.fairness_vs_care}
            leftLabel="公平" rightLabel="关怀"
            dimKey="fairness_vs_care" dimLabel="公平 vs 关怀"
            onConfClick={handleConfClick} onDisagree={handleDisagree} onExplore={handleExplore} />
          <ValueCard label="现在 vs 未来" value={dim.values.present_vs_future}
            leftLabel="现在" rightLabel="未来"
            dimKey="present_vs_future" dimLabel="现在 vs 未来"
            onConfClick={handleConfClick} onDisagree={handleDisagree} onExplore={handleExplore} />
          <ValueCard label="深度 vs 广度" value={dim.values.depth_vs_breadth}
            leftLabel="深度" rightLabel="广度"
            dimKey="depth_vs_breadth" dimLabel="深度 vs 广度"
            onConfClick={handleConfClick} onDisagree={handleDisagree} onExplore={handleExplore} />
        </DimensionGroup>

        {/* Relationship Patterns */}
        <DimensionGroup title="关系模式" color="#c084fc">
          <ExpandableCard
            header={
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">依恋风格</span>
                  <button
                    onClick={() => handleConfClick('attachment_style', '依恋风格', dim.relationship_patterns.attachment_style.confidence)}
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      dim.relationship_patterns.attachment_style.confidence >= 80
                        ? 'bg-accent-teal/15 text-accent-teal'
                        : dim.relationship_patterns.attachment_style.confidence >= 60
                          ? 'bg-accent-gold/15 text-accent-gold'
                          : 'bg-red-400/15 text-red-400'
                    }`}
                  >
                    {dim.relationship_patterns.attachment_style.confidence}%
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DIMENSION_OPTIONS.attachment_style.map((opt) => {
                    const active = opt === dim.relationship_patterns.attachment_style.result
                    return (
                      <span key={opt} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40 font-medium'
                          : 'bg-white/5 text-text-muted border-white/10'
                      }`}>{opt}</span>
                    )
                  })}
                </div>
              </div>
            }
          >
            <AttachmentChart
              anxietyScore={dim.relationship_patterns.attachment_style.anxiety_score}
              avoidanceScore={dim.relationship_patterns.attachment_style.avoidance_score}
            />
            <EvidencePanel
              evidence={dim.relationship_patterns.attachment_style.evidence}
              evidenceStructured={dim.relationship_patterns.attachment_style.evidence_structured}
              insight={dim.relationship_patterns.attachment_style.insight}
              dimKey="attachment_style"
              dimLabel="依恋风格"
              confidence={dim.relationship_patterns.attachment_style.confidence}
              onRefine={handleConfClick}
              onDisagree={handleDisagree}
            />
          </ExpandableCard>

          <ExpandableCard
            header={
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">亲密语言</span>
                  <button
                    onClick={() => handleConfClick('intimacy_language', '亲密语言', dim.relationship_patterns.intimacy_language.confidence)}
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      dim.relationship_patterns.intimacy_language.confidence >= 80
                        ? 'bg-accent-teal/15 text-accent-teal'
                        : dim.relationship_patterns.intimacy_language.confidence >= 60
                          ? 'bg-accent-gold/15 text-accent-gold'
                          : 'bg-red-400/15 text-red-400'
                    }`}
                  >
                    {dim.relationship_patterns.intimacy_language.confidence}%
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INTIMACY_OPTIONS.map((opt) => {
                    const isPrimary = opt === dim.relationship_patterns.intimacy_language.primary
                    const isSecondary = opt === dim.relationship_patterns.intimacy_language.secondary
                    return (
                      <span key={opt} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        isPrimary ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40 font-medium'
                          : isSecondary ? 'bg-accent-teal/15 text-accent-teal border-accent-teal/30'
                            : 'bg-white/5 text-text-muted border-white/10'
                      }`}>
                        {opt}{isPrimary && ' · 主'}{isSecondary && ' · 次'}
                      </span>
                    )
                  })}
                </div>
              </div>
            }
          >
            <EvidencePanel
              evidence={dim.relationship_patterns.intimacy_language.evidence}
              evidenceStructured={dim.relationship_patterns.intimacy_language.evidence_structured}
              insight={dim.relationship_patterns.intimacy_language.insight}
              dimKey="intimacy_language"
              dimLabel="亲密语言"
              confidence={dim.relationship_patterns.intimacy_language.confidence}
              onRefine={handleConfClick}
              onDisagree={handleDisagree}
            />
          </ExpandableCard>

          <DimensionCard
            label="边界风格"
            result={dim.relationship_patterns.boundary_style.result}
            options={DIMENSION_OPTIONS.boundary_style}
            evidence={dim.relationship_patterns.boundary_style.evidence}
            evidenceStructured={dim.relationship_patterns.boundary_style.evidence_structured}
            insight={dim.relationship_patterns.boundary_style.insight}
            confidence={dim.relationship_patterns.boundary_style.confidence}
            dimKey="boundary_style"
            dimLabel="边界风格"
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <DimensionCard
            label="社交能量"
            result={dim.relationship_patterns.social_energy.result}
            options={DIMENSION_OPTIONS.social_energy}
            evidence={dim.relationship_patterns.social_energy.evidence}
            evidenceStructured={dim.relationship_patterns.social_energy.evidence_structured}
            insight={dim.relationship_patterns.social_energy.insight}
            confidence={dim.relationship_patterns.social_energy.confidence}
            dimKey="social_energy"
            dimLabel="社交能量"
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <DimensionCard
            label="冲突后修复"
            result={dim.relationship_patterns.conflict_repair.result}
            options={DIMENSION_OPTIONS.conflict_repair}
            evidence={dim.relationship_patterns.conflict_repair.evidence}
            evidenceStructured={dim.relationship_patterns.conflict_repair.evidence_structured}
            insight={dim.relationship_patterns.conflict_repair.insight}
            confidence={dim.relationship_patterns.conflict_repair.confidence}
            dimKey="conflict_repair"
            dimLabel="冲突后修复"
            onDisagree={handleDisagree}
          />
        </DimensionGroup>

        {/* Unfinished Self */}
        <DimensionGroup title="未完成的自我" color="#ff6b6b">
          <UnfinishedCard
            label="被压抑的表达"
            item={dim.unfinished_self.suppressed_expression}
            dimKey="suppressed_expression"
            dimLabel="被压抑的表达"
            onConfClick={handleConfClick}
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <UnfinishedCard
            label="向往的身份"
            item={dim.unfinished_self.aspired_identity}
            dimKey="aspired_identity"
            dimLabel="向往的身份"
            onConfClick={handleConfClick}
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <UnfinishedCard
            label="逃离的方向"
            item={dim.unfinished_self.escape_direction}
            dimKey="escape_direction"
            dimLabel="逃离的方向"
            onConfClick={handleConfClick}
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
          <UnfinishedCard
            label="关系中的渴望角色"
            item={dim.unfinished_self.desired_role}
            dimKey="desired_role"
            dimLabel="关系中的渴望角色"
            onConfClick={handleConfClick}
            onDisagree={handleDisagree}
            onExplore={handleExplore}
          />
        </DimensionGroup>

        {/* Evolution Direction */}
        <div className="bg-bg-card rounded-xl p-5 border border-accent-gold/20">
          <p className="text-xs text-accent-gold mb-2">演化方向</p>
          <p className="text-base text-text-primary leading-relaxed">
            {dim.evolution_direction}
          </p>
        </div>

        {/* Overall Portrait */}
        <div className="bg-bg-card rounded-xl p-5 border border-text-muted/15">
          <p className="text-xs text-text-muted mb-2">整体画像</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {dim.overall_portrait}
          </p>
        </div>

        <div className="h-4" />
      </div>

      {/* Confidence Popup */}
      {confidencePopup && (
        <ConfidencePopup
          dimensionKey={confidencePopup.key}
          dimensionLabel={confidencePopup.label}
          confidence={confidencePopup.confidence}
          onClose={() => setConfidencePopup(null)}
        />
      )}

      {/* Disagree Popup */}
      {disagreePopup && (
        <DisagreePopup
          dimKey={disagreePopup.key}
          dimLabel={disagreePopup.label}
          onClose={() => setDisagreePopup(null)}
          onRetryAll={handleRetryAll}
        />
      )}
    </div>
  )
}

// ---- Sub-components ----

function DimensionGroup({ title, color, children }: {
  title: string; color: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-bg-card rounded-xl overflow-hidden border border-text-muted/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3"
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-text-primary flex-1 text-left">{title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

function DimensionCard({
  label, result, options, evidence, evidenceStructured, insight, confidence, dimKey, dimLabel, onDisagree, onExplore,
}: {
  label: string
  result: string
  options: readonly string[]
  evidence: string
  evidenceStructured?: import('../lib/supabase').StructuredEvidence
  insight: string
  confidence: number
  dimKey: string
  dimLabel: string
  onDisagree?: (key: string, label: string) => void
  onExplore?: (key: string, label: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLowConfidence = confidence < 40
  return (
    <div className={isLowConfidence ? 'opacity-50' : ''}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">{label}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
              confidence >= 70 ? 'bg-accent-teal/15 text-accent-teal'
                : confidence >= 40 ? 'bg-accent-gold/15 text-accent-gold'
                  : 'bg-text-muted/10 text-text-muted'
            }`}>
              {confidence}%
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const active = opt === result
              return (
                <span key={opt} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active ? (isLowConfidence ? 'bg-white/5 text-text-muted border-white/10' : 'bg-accent-gold/20 text-accent-gold border-accent-gold/40 font-medium')
                    : 'bg-white/5 text-text-muted border-white/10'
                }`}>{opt}</span>
              )
            })}
          </div>
          {isLowConfidence && onExplore && (
            <p className="text-[11px] text-text-muted mt-2">
              对话中未充分涉及此维度
              <button
                onClick={(e) => { e.stopPropagation(); onExplore(dimKey, dimLabel) }}
                className="ml-1 text-accent-gold/70 hover:text-accent-gold underline transition-colors"
              >
                继续探索 →
              </button>
            </p>
          )}
        </div>
      </button>
      {expanded && (
        <div className="mt-1">
          <EvidencePanel
            evidence={evidence}
            evidenceStructured={evidenceStructured}
            insight={insight}
            dimKey={dimKey}
            dimLabel={dimLabel}
            confidence={confidence}
            onDisagree={onDisagree}
          />
        </div>
      )}
    </div>
  )
}

function ValueCard({
  label, value, leftLabel, rightLabel, dimKey, dimLabel, onConfClick, onDisagree, onExplore,
}: {
  label: string
  value: { result: number; confidence: number; insight: string; evidence: string; evidence_structured?: import('../lib/supabase').StructuredEvidence }
  leftLabel: string; rightLabel: string
  dimKey: string; dimLabel: string
  onConfClick: (key: string, label: string, confidence: number) => void
  onDisagree?: (key: string, label: string) => void
  onExplore?: (key: string, label: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLowConfidence = value.confidence < 40
  return (
    <div className={isLowConfidence ? 'opacity-50' : ''}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text-secondary">{label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onConfClick(dimKey, dimLabel, value.confidence) }}
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                value.confidence >= 70 ? 'bg-accent-teal/15 text-accent-teal'
                  : value.confidence >= 40 ? 'bg-accent-gold/15 text-accent-gold'
                    : 'bg-text-muted/10 text-text-muted'
              }`}
            >
              {value.confidence}%
            </button>
          </div>
          <SpectrumBar value={value.result} leftLabel={leftLabel} rightLabel={rightLabel} />
          {isLowConfidence && onExplore && (
            <p className="text-[11px] text-text-muted mt-2">
              对话中未充分涉及
              <button
                onClick={(e) => { e.stopPropagation(); onExplore(dimKey, dimLabel) }}
                className="ml-1 text-accent-gold/70 hover:text-accent-gold underline transition-colors"
              >
                继续探索 →
              </button>
            </p>
          )}
        </div>
      </button>
      {expanded && (
        <div className="mt-1">
          <EvidencePanel
            evidence={value.evidence}
            evidenceStructured={value.evidence_structured}
            insight={value.insight}
            dimKey={dimKey}
            dimLabel={dimLabel}
            confidence={value.confidence}
            onRefine={onConfClick}
            onDisagree={onDisagree}
          />
        </div>
      )}
    </div>
  )
}

function ExpandableCard({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
      <div className="bg-white/5 rounded-lg p-3">
        {header}
        {expanded && <div className="mt-2">{children}</div>}
      </div>
    </button>
  )
}

function UnfinishedCard({
  label, item, dimKey, dimLabel, onConfClick, onDisagree, onExplore,
}: {
  label: string
  item: { description: string; confidence: number; insight: string; evidence: string; evidence_structured?: import('../lib/supabase').StructuredEvidence }
  dimKey: string; dimLabel: string
  onConfClick: (key: string, label: string, confidence: number) => void
  onDisagree?: (key: string, label: string) => void
  onExplore?: (key: string, label: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<'helpful' | 'not_for_me' | 'not_tried'>('not_tried')
  const isLowConfidence = item.confidence < 40

  const actionHints: Record<string, string> = {
    suppressed_expression: '下周有一次机会，你可以不说"都行"而是说"我想要X"。就一次。',
    aspired_identity: '下次你心里有判断但犹豫要不要说时，先问自己——"如果我不说，会后悔吗？"',
    escape_direction: '这周做一件"不想做但一直忍着"的事的另一面——哪怕只是十分钟。',
    desired_role: '下次和信任的人在一起时，试着不扮演你平时的角色——看看对方会不会注意到。',
  }

  const hint = actionHints[dimKey] || null

  return (
    <div className={isLowConfidence ? 'opacity-50' : ''}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="bg-white/5 rounded-lg p-4 border-l-2 border-[#ff6b6b]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">{label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onConfClick(dimKey, dimLabel, item.confidence) }}
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                item.confidence >= 70 ? 'bg-accent-teal/15 text-accent-teal'
                  : item.confidence >= 40 ? 'bg-accent-gold/15 text-accent-gold'
                    : 'bg-text-muted/10 text-text-muted'
              }`}
            >
              {item.confidence}%
            </button>
          </div>
          <p className="text-sm text-text-primary leading-relaxed italic">"{item.insight}"</p>
          <p className="text-xs text-text-muted mt-2">{item.description}</p>
          {isLowConfidence && onExplore && (
            <p className="text-[11px] text-text-muted mt-2">
              对话中未充分涉及
              <button
                onClick={(e) => { e.stopPropagation(); onExplore(dimKey, dimLabel) }}
                className="ml-1 text-accent-gold/70 hover:text-accent-gold underline transition-colors"
              >
                继续探索 →
              </button>
            </p>
          )}

          {/* Action Hint (visible when expanded or always for first view) */}
          {hint && (
            <div className="mt-3 pt-3 border-t border-[#ff6b6b]/15">
              <p className="text-[10px] text-[#ff6b6b]/70 mb-1 tracking-wider">试试看</p>
              <p className="text-xs text-text-secondary leading-relaxed">{hint}</p>
              {actionFeedback === 'not_tried' && (
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionFeedback('helpful') }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal
                      hover:bg-accent-teal/20 transition-colors"
                  >
                    有用
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionFeedback('not_for_me') }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted
                      hover:bg-white/10 transition-colors"
                  >
                    不适合我
                  </button>
                </div>
              )}
              {actionFeedback === 'helpful' && (
                <p className="text-[10px] text-accent-teal mt-1.5">已标记"有用"——好的，继续保持</p>
              )}
              {actionFeedback === 'not_for_me' && (
                <p className="text-[10px] text-text-muted mt-1.5">已记录，下次会调整方向</p>
              )}
            </div>
          )}
        </div>
      </button>
      {expanded && (
        <div className="mt-1">
          <EvidencePanel
            evidence={item.evidence}
            evidenceStructured={item.evidence_structured}
            insight={item.insight}
            dimKey={dimKey}
            dimLabel={dimLabel}
            confidence={item.confidence}
            onRefine={onConfClick}
            onDisagree={onDisagree}
          />
        </div>
      )}
    </div>
  )
}
