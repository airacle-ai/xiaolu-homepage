import type { Goal, SavingRecord } from './types'

const KEY = 'manmanyongyou.goals.v1'

export function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Goal[]
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

export function createRecord(amount: number, note?: string): SavingRecord {
  return {
    id: uid(),
    amount,
    note: note?.trim() || undefined,
    createdAt: Date.now(),
  }
}
