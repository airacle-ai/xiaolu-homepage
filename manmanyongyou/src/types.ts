export type Theme =
  | 'home'
  | 'travel'
  | 'tech'
  | 'beauty'
  | 'self'
  | 'appliance'
  | 'other'

export type Direction = 'save' | 'spend'

export type Category =
  | 'food'
  | 'transit'
  | 'wear'
  | 'tech'
  | 'home'
  | 'fun'
  | 'other'

export interface SavingRecord {
  id: string
  amount: number
  note?: string
  category?: Category    // 仅 spend 模式有意义；save 模式留空
  createdAt: number
}

export interface Goal {
  id: string
  title: string
  targetAmount: number
  savedAmount: number
  unitAmount: number
  image: string
  theme: Theme
  createdAt: number
  updatedAt: number
  records: SavingRecord[]
  // v0.2 新增字段——所有字段对老数据可选/带默认
  direction?: Direction              // 'save'（默认）| 'spend'
}
