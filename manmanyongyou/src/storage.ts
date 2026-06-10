import type { ArchivedCycle, Direction, Goal, SavingRecord } from './types'

const KEY = 'manmanyongyou.goals.v1'

function migrate(g: any): Goal {
  return {
    ...g,
    direction: (g.direction as Direction) || 'save',
    records: Array.isArray(g.records) ? g.records : [],
    archivedCycles: Array.isArray(g.archivedCycles) ? g.archivedCycles : undefined,
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

export function deriveCells(g: Goal) {
  const totalCells = Math.max(1, Math.ceil(g.targetAmount / g.unitAmount))
  const consumed = Math.min(totalCells, Math.floor(g.savedAmount / g.unitAmount))
  const isSpend = (g.direction || 'save') === 'spend'
  const litCells = isSpend ? totalCells - consumed : consumed
  const isDone = g.savedAmount >= g.targetAmount
  return { totalCells, consumed, litCells, isDone, isSpend }
}

// —— v0.3: cycle reset helpers ——

/**
 * 计算给定 cycleResetDay 应触发重置的最近一次"重置时间点"。
 * 例：cycleResetDay = 1，当前 2026-06-15 → 上次重置点为 2026-06-01 00:00
 */
function lastResetMoment(now: Date, day: number): Date {
  const candidate = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0, 0)
  if (candidate.getTime() <= now.getTime()) return candidate
  // 否则用上个月的同一天
  return new Date(now.getFullYear(), now.getMonth() - 1, day, 0, 0, 0, 0)
}

/**
 * 自动检查 goal 是否到了重置时点；如果 cycleStartedAt < 最近一次重置点，则归档当前周期 + 重置。
 * 返回新的 Goal（可能未变化）。纯函数。
 */
export function autoApplyCycleReset(g: Goal, now: Date = new Date()): Goal {
  if (g.direction !== 'spend') return g
  if (!g.cycleResetDay) return g
  const lastReset = lastResetMoment(now, g.cycleResetDay)
  const cycleStart = g.cycleStartedAt ?? g.createdAt
  if (cycleStart >= lastReset.getTime()) return g // 还在当前周期内

  // 跨过了重置点 → 归档 + 重置
  const archived: ArchivedCycle = {
    startedAt: cycleStart,
    endedAt: lastReset.getTime(),
    totalAmount: g.savedAmount,
    recordCount: g.records.length,
  }
  return {
    ...g,
    savedAmount: 0,
    records: [],
    cycleStartedAt: lastReset.getTime(),
    archivedCycles: [...(g.archivedCycles || []), archived],
    updatedAt: now.getTime(),
  }
}

/** 主动重置（用户点按钮）。无论时间点都触发。 */
export function manualCycleReset(g: Goal, now: Date = new Date()): Goal {
  if (g.direction !== 'spend') return g
  const cycleStart = g.cycleStartedAt ?? g.createdAt
  const archived: ArchivedCycle = {
    startedAt: cycleStart,
    endedAt: now.getTime(),
    totalAmount: g.savedAmount,
    recordCount: g.records.length,
  }
  return {
    ...g,
    savedAmount: 0,
    records: [],
    cycleStartedAt: now.getTime(),
    archivedCycles: [...(g.archivedCycles || []), archived],
    updatedAt: now.getTime(),
  }
}

// —— v0.3: streak（连续天数）——

/**
 * 计算 goal 当前的"连续打卡天数"。
 * 规则：以"今天"为终点，向前看：如果今天有 record 则 streak ≥ 1；
 * 如果昨天也有 → ≥ 2；中断（某一天空白）即停止。
 * 如果今天没 record 但昨天有，仍按"昨天结束"计算 streak（用户上来还能看见 streak）。
 * 返回 0 表示没有连续段或被打断。
 */
export function computeStreak(g: Goal, now: Date = new Date()): number {
  if (g.records.length === 0) return 0
  const byDay = new Set<string>()
  for (const r of g.records) {
    const d = new Date(r.createdAt)
    byDay.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  }
  const startFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayKey = `${startFrom.getFullYear()}-${startFrom.getMonth()}-${startFrom.getDate()}`
  // 若今天没有，但昨天有，从昨天开始数
  let cursor = startFrom
  if (!byDay.has(todayKey)) {
    const yest = new Date(startFrom)
    yest.setDate(yest.getDate() - 1)
    const yestKey = `${yest.getFullYear()}-${yest.getMonth()}-${yest.getDate()}`
    if (!byDay.has(yestKey)) return 0
    cursor = yest
  }
  let streak = 0
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
    if (!byDay.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// —— v0.3: 自动归档完成超过 7 天的目标 ——
const AUTO_ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

export function autoApplyArchive(g: Goal, now: Date = new Date()): Goal {
  if (g.archivedAt) return g
  if ((g.direction || 'save') !== 'save') return g // 只对 save 模式做自动归档
  if (g.savedAmount < g.targetAmount) return g
  // 找最近一次记录的时间，作为"完成时间"近似
  const lastTs = g.records.length > 0 ? g.records[g.records.length - 1].createdAt : g.updatedAt
  if (now.getTime() - lastTs >= AUTO_ARCHIVE_AFTER_MS) {
    return { ...g, archivedAt: now.getTime() }
  }
  return g
}
