import { useState } from 'react'
import type { Goal } from '../types'
import { deriveCells } from '../storage'

interface Props {
  goals: Goal[]
  onCreate: () => void
  onOpen: (id: string) => void
  onUpdate: (goal: Goal) => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - ts) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return `${diff}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function GoalCard({
  g,
  onOpen,
  onToggleArchive,
}: {
  g: Goal
  onOpen: (id: string) => void
  onToggleArchive: (g: Goal) => void
}) {
  const { totalCells, litCells, isSpend, isDone } = deriveCells(g)
  const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100)
  const lastTs =
    g.records.length > 0
      ? g.records[g.records.length - 1].createdAt
      : g.updatedAt
  const lastVerb = isSpend ? '最近花掉' : '最近存入'
  const remaining = Math.max(0, g.targetAmount - g.savedAmount)
  const archived = !!g.archivedAt

  return (
    <div className={`goal-card ${archived ? 'archived' : ''}`} onClick={() => onOpen(g.id)}>
      <img className="goal-card-image" src={g.image} alt="" />
      <div className="goal-card-body">
        <div>
          <h3 className="goal-card-title">
            {g.title}
            <span className={`mode-badge ${isSpend ? 'spend' : 'save'}`}>
              {isSpend ? '🌿' : '🌷'}
            </span>
            {isDone && (
              <span className={`done-tag ${isSpend ? 'spend' : ''}`}>
                {isSpend ? '花完' : '已拥有'}
              </span>
            )}
          </h3>
          <div className="goal-card-meta">
            {lastVerb} · {formatDate(lastTs)}
            {archived && (
              <button
                style={{
                  marginLeft: 10,
                  fontSize: 11,
                  color: 'var(--coral-deep)',
                  background: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleArchive(g)
                }}
              >
                恢复
              </button>
            )}
          </div>
          <div className="goal-card-amount">
            {isSpend ? (
              <>
                <span style={{ color: '#5C7A5E', fontWeight: 700, fontSize: 15 }}>
                  还能花 ¥{remaining.toLocaleString()}
                </span>
                <span style={{ color: 'var(--ink-soft)' }}>
                  {' / ¥'}{g.targetAmount.toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <strong>¥{g.savedAmount.toLocaleString()}</strong>
                {' / '}¥{g.targetAmount.toLocaleString()}
              </>
            )}
          </div>
        </div>
        <div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${isSpend ? 'spend' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="progress-row">
            <span>
              {isSpend
                ? `还剩 ${litCells} / ${totalCells} 格`
                : `已点亮 ${litCells} / ${totalCells} 格`}
            </span>
            <span>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage({ goals, onCreate, onOpen, onUpdate }: Props) {
  const [showArchived, setShowArchived] = useState(false)
  const active = goals.filter((g) => !g.archivedAt)
  const archived = goals.filter((g) => g.archivedAt)

  function toggleArchive(g: Goal) {
    onUpdate({ ...g, archivedAt: g.archivedAt ? undefined : Date.now() })
  }

  return (
    <div>
      <header className="app-header">
        <div>
          <h1 className="app-title">慢慢拥有</h1>
          <div className="app-subtitle">把想要的，点亮；把想留住的，守住</div>
        </div>
        {goals.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={onCreate}>
            + 新建
          </button>
        )}
      </header>

      <div className="home-content">
        {goals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🌷</span>
            <div className="empty-title">先从一个想拥有 / 想守住的开始</div>
            <div className="empty-desc">存钱 → 点亮一格；花钱 → 熄灭一格</div>
            <button className="btn btn-primary" onClick={onCreate}>
              创建我的第一个
            </button>
          </div>
        ) : (
          <>
            {active.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <span className="empty-emoji" style={{ fontSize: 40 }}>🌱</span>
                <div className="empty-title">现在没有进行中的目标</div>
                <div className="empty-desc">已完成的都收起在下面</div>
                <button className="btn btn-primary btn-sm" onClick={onCreate}>
                  开启新的一个
                </button>
              </div>
            )}
            {active.map((g) => (
              <GoalCard key={g.id} g={g} onOpen={onOpen} onToggleArchive={toggleArchive} />
            ))}

            {archived.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-line" />
                  <div
                    className="section-divider-text"
                    onClick={() => setShowArchived((v) => !v)}
                  >
                    已收起 {archived.length} 个 {showArchived ? '▲' : '▼'}
                  </div>
                  <div className="section-divider-line" />
                </div>
                {showArchived &&
                  archived.map((g) => (
                    <GoalCard key={g.id} g={g} onOpen={onOpen} onToggleArchive={toggleArchive} />
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
