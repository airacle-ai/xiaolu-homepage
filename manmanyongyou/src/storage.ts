import type { Direction, Goal, SavingRecord } from './types'

const KEY = 'manmanyongyou.goals.v1'

function migrate(g: any): Goal {
  // v0.1 → v0.2：缺省 direction 视为 save
  return {
    ...g,
    direction: (g.direction as Direction) || 'save',
    records: Array.isArray(g.records) ? g.records : [],
  } as Goal
}

export function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(migrate)
  } catch (e) {
    console.warn('loadGoals failed', e)
    return []
  }
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(goals))
  } catch (e) {
    console.warn('saveGoals failed', e)
  }
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function createRecord(
  amount: number,
  note?: string,
  category?: SavingRecord['category'],
): SavingRecord {
  return {
    id: uid(),
    amount,
    note: note?.trim() || undefined,
    category,
    createdAt: Date.now(),
  }
}

// —— v0.2 派生工具：根据 direction 计算 litCells ——
// save  模式：litCells = floor(savedAmount / unitAmount)（点亮）
// spend 模式：litCells 含义改为「还剩下没花的格数」= totalCells - floor(savedAmount/unitAmount)
//   UI 上 spend 模式仍然是「亮 = 还守着的」
export function deriveCells(g: Goal) {
  const totalCells = Math.max(1, Math.ceil(g.targetAmount / g.unitAmount))
  const consumed = Math.min(totalCells, Math.floor(g.savedAmount / g.unitAmount))
  const isSpend = (g.direction || 'save') === 'spend'
  const litCells = isSpend ? totalCells - consumed : consumed
  const isDone = g.savedAmount >= g.targetAmount
  return { totalCells, consumed, litCells, isDone, isSpend }
}
