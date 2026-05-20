import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getUser, createUser } from '../lib/supabase'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useUser()

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError('请输入 6 位数字')
      return
    }

    setLoading(true)
    setError('')

    try {
      let user = await getUser(pin)
      if (!user) {
        user = await createUser(pin)
      }
      setUser(user)
      navigate('/chat')
    } catch {
      setError('连接失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 6) {
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh px-6">
      {/* Logo & Title */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-accent-gold mb-3 tracking-tight">
          Oprah
        </h1>
        <p className="text-text-secondary text-lg">
          了解你自己，发现你们之间
        </p>
      </div>

      {/* PIN Input */}
      <div className="w-full max-w-xs">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="输入你的 6 位数字"
          value={pin}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6)
            setPin(v)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          className="w-full text-center text-2xl tracking-[0.5em] py-4 px-4
            bg-bg-secondary border border-text-muted/30 rounded-xl
            text-text-primary placeholder:text-text-muted placeholder:tracking-normal placeholder:text-base
            focus:outline-none focus:border-accent-teal/60 focus:ring-1 focus:ring-accent-teal/30
            transition-all"
          autoFocus
        />

        {/* Dots indicator */}
        <div className="flex justify-center gap-2.5 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-accent-gold scale-110'
                  : 'bg-text-muted/30'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mt-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={pin.length !== 6 || loading}
          className="w-full mt-6 py-3.5 rounded-xl font-medium text-base
            bg-accent-gold text-bg-primary
            disabled:opacity-30 disabled:cursor-not-allowed
            active:scale-[0.98] transition-all"
        >
          {loading ? '进入中...' : '开始探索'}
        </button>
      </div>
    </div>
  )
}
