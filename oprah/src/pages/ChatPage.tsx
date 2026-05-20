import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { updateUser, type ChatMessage, type DimensionResult } from '../lib/supabase'
import { streamChatMessage } from '../lib/claude'
import { runAnalysis } from '../lib/analysis'
import ProgressIndicator, { type ProgressData } from '../components/ProgressIndicator'

// Look up a dimension's confidence by its key, regardless of which of the 4 categories it lives in.
function findConfidence(dimensions: DimensionResult | null, key: string): number | null {
  if (!dimensions) return null
  const groups = [
    dimensions.thinking_styles,
    dimensions.values,
    dimensions.relationship_patterns,
    dimensions.unfinished_self,
  ] as Array<Record<string, { confidence?: number }>>
  for (const g of groups) {
    const item = g?.[key]
    if (item && typeof item.confidence === 'number') return item.confidence
  }
  return null
}

export default function ChatPage() {
  const { user, setUser } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [progress, setProgress] = useState<ProgressData>({})
  const [inputEnabled, setInputEnabled] = useState(true)
  const [showAnalysisButton, setShowAnalysisButton] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showRefinementButton, setShowRefinementButton] = useState(false)
  const [isSavingExit, setIsSavingExit] = useState(false)
  const [refinementTarget, setRefinementTarget] = useState<{ key: string; label: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const savingRef = useRef(false)
  const refinementHandled = useRef(false)
  const progressRef = useRef<ProgressData>({})
  progressRef.current = progress

  // Load existing chat history
  useEffect(() => {
    if (!user) return
    const history = user.chat_history || []
    setMessages(history)
    setProgress((user.progress as ProgressData) || {})

    // If no history, send a hidden trigger to get Oprah's opening
    if (history.length === 0) {
      triggerOprahResponse([{ role: 'user', content: '你好，请开始吧' }], [])
    } else if (!user.match_code) {
      // Check if last message had [ANALYSIS_READY] — restore button if user refreshed before clicking
      const lastMsg = history[history.length - 1]
      if (lastMsg?.role === 'assistant' && lastMsg.content.includes('[ANALYSIS_READY]')) {
        setShowAnalysisButton(true)
        setInputEnabled(false)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle refinement: when navigating back from MapPage with a dimension to refine
  useEffect(() => {
    const state = location.state as { refineKey?: string; refineLabel?: string } | null
    if (!state?.refineKey || !state?.refineLabel || !user || refinementHandled.current) return
    refinementHandled.current = true

    // Clear the navigation state so it doesn't re-trigger
    window.history.replaceState({}, '')

    setRefinementTarget({ key: state.refineKey, label: state.refineLabel })

    const currentConfidence = findConfidence(user.dimensions, state.refineKey)
    const confidenceNote = currentConfidence !== null
      ? `当前该维度的确信度是 ${currentConfidence}%。目标：让确信度达到 90% 以上。`
      : `目标：让该维度的确信度达到 90% 以上。`

    const systemMsg: ChatMessage = {
      role: 'system',
      content: `用户希望提升「${state.refineLabel}」维度的确信度。${confidenceNote}请按系统提示中「确信度提升模式」的规则，至少覆盖 3-4 个不同情境，直到你对该维度有跨情境一致的充分证据再收尾。`,
    }
    // Use the latest in-memory messages (not user.chat_history, which may be stale after prior analysis)
    const baseMessages = messages.length > 0 ? messages : (user.chat_history || [])
    const updatedMessages = [...baseMessages, systemMsg]
    setMessages(updatedMessages)
    triggerOprahResponse(updatedMessages)
  }, [location.state]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Save chat history to Supabase with queueing — ensures the LATEST snapshot always gets persisted
  const pendingSaveRef = useRef<{ msgs: ChatMessage[]; prog: ProgressData } | null>(null)
  const saveToSupabase = useCallback(
    async (msgs: ChatMessage[], prog: ProgressData) => {
      if (!user) return
      // Always queue the latest snapshot
      pendingSaveRef.current = { msgs, prog }
      // If a save is already in flight, it will pick up the queued snapshot when it finishes
      if (savingRef.current) return
      savingRef.current = true

      while (pendingSaveRef.current) {
        const snapshot = pendingSaveRef.current
        pendingSaveRef.current = null
        try {
          await updateUser(user.pin_code, {
            chat_history: snapshot.msgs,
            progress: snapshot.prog,
          })
          // Keep UserContext in sync so navigation away and back doesn't lose recent messages
          setUser({ ...user, chat_history: snapshot.msgs, progress: snapshot.prog })
          console.log('[Oprah] saved', snapshot.msgs.length, 'messages')
        } catch (e) {
          console.error('[Oprah] save failed:', e)
          // Put the snapshot back so we retry on next trigger
          if (!pendingSaveRef.current) pendingSaveRef.current = snapshot
          break
        }
      }

      savingRef.current = false
    },
    [user, setUser]
  )

  // apiMessages: sent to Claude API; displayMessages: what to save/show (omits hidden triggers)
  const triggerOprahResponse = async (apiMessages: ChatMessage[], displayMessages?: ChatMessage[]) => {
    const savableMessages = displayMessages ?? apiMessages
    setIsStreaming(true)
    setInputEnabled(false)
    setStreamingText('')

    await streamChatMessage(
      apiMessages,
      (text) => setStreamingText(text),
      (fullText) => {
        setIsStreaming(false)
        setStreamingText('')

        const hasAnalysisReady = fullText.includes('[ANALYSIS_READY]')
        const hasRefinementReady = fullText.includes('[REFINEMENT_READY]')

        // Parse [DIMS: key1, key2] marker and update progress
        const dimsMatch = fullText.match(/\[DIMS:\s*([^\]]*)\]/)
        let nextProgress = progressRef.current
        if (dimsMatch) {
          const keys = dimsMatch[1].split(',').map((k) => k.trim()).filter(Boolean)
          if (keys.length > 0) {
            nextProgress = { ...progressRef.current }
            for (const k of keys) nextProgress[k] = true
            setProgress(nextProgress)
          }
        }

        // Strip only DIMS marker from saved content; keep ANALYSIS_READY/REFINEMENT_READY
        // so we can detect interrupted analysis state on reload. displayText() hides them from UI.
        const savedText = fullText.replace(/\[DIMS:[^\]]*\]/g, '').trim()
        const assistantMsg: ChatMessage = { role: 'assistant', content: savedText }
        const updatedMessages = [...savableMessages, assistantMsg]
        setMessages(updatedMessages)
        saveToSupabase(updatedMessages, nextProgress)

        if (hasAnalysisReady) {
          setShowAnalysisButton(true)
          setInputEnabled(false)
        } else if (hasRefinementReady) {
          setShowRefinementButton(true)
          setInputEnabled(false)
        } else {
          // Delay enabling input by 300ms
          setTimeout(() => setInputEnabled(true), 300)
        }
      },
      (error) => {
        setIsStreaming(false)
        setStreamingText('')
        setInputEnabled(true)
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ ${error}，请重新发送消息。`,
        }
        setMessages([...savableMessages, errorMsg])
      }
    )
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming || !inputEnabled) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')

    // Auto-resize textarea back
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    triggerOprahResponse(updatedMessages)
  }

  const handleAnalysis = async () => {
    if (!user) return
    setIsAnalyzing(true)
    setShowAnalysisButton(false)

    try {
      const { dimensions, matchCode, identityLabel } = await runAnalysis(user, messages)
      const existingVersions = user.analysis_versions || []
      setUser({
        ...user,
        chat_history: messages,
        dimensions,
        match_code: matchCode,
        identity_label: identityLabel,
        analysis_versions: [...existingVersions, { version: existingVersions.length + 1, dimensions, identity_label: identityLabel, created_at: new Date().toISOString() }],
      })
      navigate('/map')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      console.error('[Oprah] analysis failed:', e)
      setShowAnalysisButton(true)
      setIsAnalyzing(false)
      alert(`分析失败：${msg}`)
    }
  }

  const handleRefinement = async () => {
    if (!user) return
    setIsAnalyzing(true)
    setShowRefinementButton(false)

    try {
      const refinement = refinementTarget && user.dimensions
        ? { previous: user.dimensions, focusKey: refinementTarget.key, focusLabel: refinementTarget.label }
        : undefined
      const { dimensions, matchCode, identityLabel } = await runAnalysis(user, messages, refinement)
      const existingVersions = user.analysis_versions || []
      setUser({
        ...user,
        chat_history: messages,
        dimensions,
        match_code: matchCode,
        identity_label: identityLabel,
        analysis_versions: [...existingVersions, { version: existingVersions.length + 1, dimensions, identity_label: identityLabel, created_at: new Date().toISOString() }],
      })
      setRefinementTarget(null)
      refinementHandled.current = false
      setIsAnalyzing(false)
      navigate('/map')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      console.error('[Oprah] refinement failed:', e)
      setShowRefinementButton(true)
      setIsAnalyzing(false)
      alert(`分析失败：${msg}`)
    }
  }

  const handleSaveAndExit = async () => {
    if (!user || isSavingExit) return
    setIsSavingExit(true)
    try {
      // Force flush any pending saves to Supabase before exiting
      await updateUser(user.pin_code, {
        chat_history: messages,
        progress: progressRef.current,
      })
      console.log('[Oprah] saved on exit:', messages.length, 'messages')
    } catch (e) {
      console.error('[Oprah] save on exit failed:', e)
      alert('保存失败，请稍后再试')
      setIsSavingExit(false)
      return
    }
    // Clear user context and return to login
    setUser(null)
    navigate('/', { replace: true })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // Check if a message is an "insight" (non-question, contains insight markers)
  const isInsightMessage = (content: string) => {
    const hasQuestion = content.trim().endsWith('？') || content.trim().endsWith('?')
    const insightMarkers = ['你倾向于', '你的', '有意思的是', '这个矛盾', '我注意到', '其实你']
    return !hasQuestion && insightMarkers.some((m) => content.includes(m))
  }

  // Display text: handle streaming content - strip markers
  const displayText = (text: string) =>
    text
      .replaceAll('[ANALYSIS_READY]', '')
      .replaceAll('[REFINEMENT_READY]', '')
      .replace(/\[DIMS:[^\]]*\]/g, '')
      .trim()

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-accent-gold/20" />
          <div className="absolute inset-0 rounded-full border-2 border-accent-gold border-t-transparent animate-spin" />
        </div>
        <p className="text-text-secondary text-sm">Oprah 正在分析你的画像...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator + Save & Exit */}
      <div className="flex-shrink-0 border-b border-text-muted/15 bg-bg-primary/80 backdrop-blur-sm flex items-center">
        <div className="flex-1 min-w-0">
          <ProgressIndicator
            progress={progress}
            turnCount={messages.filter((m) => m.role === 'user').length}
          />
        </div>
        <button
          onClick={handleSaveAndExit}
          disabled={isSavingExit}
          className="flex-shrink-0 mr-3 my-1.5 px-3 py-1.5 rounded-lg text-xs
            text-text-secondary bg-white/5 border border-white/10
            hover:bg-white/10 active:scale-95 transition-all
            disabled:opacity-50 whitespace-nowrap"
        >
          {isSavingExit ? '保存中...' : '保存并退出'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages
          .filter((m) => m.role !== 'system')
          .map((msg, i) => (
            <div
              key={i}
              className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-teal/20 text-text-primary rounded-br-md'
                    : isInsightMessage(msg.content)
                      ? 'bg-bg-secondary text-text-primary rounded-bl-md border-l-2 border-accent-gold/60'
                      : 'bg-bg-secondary text-text-primary rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{displayText(msg.content)}</p>
              </div>
            </div>
          ))}

        {/* Streaming message */}
        {isStreaming && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-bg-secondary text-text-primary text-[15px] leading-relaxed">
              <p className="whitespace-pre-wrap">{displayText(streamingText)}</p>
            </div>
          </div>
        )}

        {/* Streaming indicator (no text yet) */}
        {isStreaming && !streamingText && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-bg-secondary">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Analysis ready button */}
        {showAnalysisButton && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleAnalysis}
              className="px-6 py-3 rounded-xl bg-accent-gold text-bg-primary font-medium
                active:scale-[0.97] transition-transform"
            >
              看看 Oprah 眼中的你 →
            </button>
          </div>
        )}

        {/* Refinement ready button */}
        {showRefinementButton && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleRefinement}
              className="px-6 py-3 rounded-xl bg-accent-teal text-bg-primary font-medium
                active:scale-[0.97] transition-transform"
            >
              查看更新后的结果 →
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-text-muted/15 bg-bg-primary/90 backdrop-blur-md px-4 py-3 safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={inputEnabled ? '说点什么...' : '等待 Oprah 回复...'}
            disabled={!inputEnabled || isStreaming}
            rows={1}
            className="flex-1 bg-bg-secondary border border-text-muted/20 rounded-xl px-4 py-2.5
              text-[15px] text-text-primary placeholder:text-text-muted
              focus:outline-none focus:border-accent-teal/50
              disabled:opacity-40 resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !inputEnabled}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-teal flex items-center justify-center
              disabled:opacity-30 active:scale-95 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1419" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
