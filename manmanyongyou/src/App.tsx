import { useEffect, useState } from 'react'
import type { Goal } from './types'
import { autoApplyArchive, autoApplyCycleReset, loadGoals, saveGoals } from './storage'
import HomePage from './components/HomePage'
import CreateGoalPage from './components/CreateGoalPage'
import GoalDetailPage from './components/GoalDetailPage'

type View =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'detail'; id: string }

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const now = new Date()
    return loadGoals().map((g) => autoApplyArchive(autoApplyCycleReset(g, now), now))
  })
  const [view, setView] = useState<View>({ name: 'home' })

  useEffect(() => {
    saveGoals(goals)
  }, [goals])

  function handleCreate(goal: Goal) {
    setGoals((prev) => [goal, ...prev])
    setView({ name: 'detail', id: goal.id })
  }

  function handleUpdate(goal: Goal) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)))
  }

  function handleDelete(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    setView({ name: 'home' })
  }

  const current = view.name === 'detail' ? goals.find((g) => g.id === view.id) : null

  return (
    <div className="app-shell">
      <div className="app-frame">
        {view.name === 'home' && (
          <HomePage
            goals={goals}
            onCreate={() => setView({ name: 'create' })}
            onOpen={(id) => setView({ name: 'detail', id })}
            onUpdate={handleUpdate}
          />
        )}
        {view.name === 'create' && (
          <CreateGoalPage
            onCancel={() => setView({ name: 'home' })}
            onCreate={handleCreate}
          />
        )}
        {view.name === 'detail' && current && (
          <GoalDetailPage
            goal={current}
            onBack={() => setView({ name: 'home' })}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
        {view.name === 'detail' && !current && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p>找不到这个目标了</p>
            <button className="btn btn-primary" onClick={() => setView({ name: 'home' })}>
              回首页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
