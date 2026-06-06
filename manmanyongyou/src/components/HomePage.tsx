import type { Goal } from '../types'

interface Props {
  goals: Goal[]
  onCreate: () => void
  onOpen: (id: string) => void
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

export default function HomePage({ goals, onCreate, onOpen }: Props) {
  return (
    <div>
      <header className="app-header">
        <div>
          <h1 className="app-title">慢慢拥有</h1>
          <div className="app-subtitle">把想要的东西，一格一格点亮</div>
        </div>
        {goals.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={onCreate}>
            + 新目标
          </button>
        )}
      </header>

      <div className="home-content">
        {goals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🌷</span>
            <div className="empty-title">先从一个想拥有的东西开始</div>
            <div className="empty-desc">每一笔存入，都是把它点亮一格</div>
            <button className="btn btn-primary" onClick={onCreate}>
              创建我的第一个目标
            </button>
          </div>
        ) : (
          goals.map((g) => {
            const totalCells = Math.max(1, Math.ceil(g.targetAmount / g.unitAmount))
            const litCells = Math.min(totalCells, Math.floor(g.savedAmount / g.unitAmount))
            const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100)
            const lastTs =
              g.records.length > 0
                ? g.records[g.records.length - 1].createdAt
                : g.updatedAt
            const isDone = g.savedAmount >= g.targetAmount
            return (
              <div key={g.id} className="goal-card" onClick={() => onOpen(g.id)}>
                <img className="goal-card-image" src={g.image} alt="" />
                <div className="goal-card-body">
                  <div>
                    <h3 className="goal-card-title">
                      {g.title}
                      {isDone && <span className="done-tag">已拥有</span>}
                    </h3>
                    <div className="goal-card-meta">
                      最近存入 · {formatDate(lastTs)}
                    </div>
                    <div className="goal-card-amount">
                      <strong>¥{g.savedAmount.toLocaleString()}</strong>
                      {' / '}¥{g.targetAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-row">
                      <span>已点亮 {litCells} / {totalCells} 格</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
