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
  category?: Category
  createdAt: number
}

// v0.3 新增：一个已结束的预算周期归档
export interface ArchivedCycle {
  endedAt: number          // 结束时间戳
  startedAt: number        // 周期开始时间戳
  totalAmount: number      // 这个周期花掉的总额（spend 模式语义）
  recordCount: number      // 这个周期的记录条数
  // 记录详情不存进每个归档，避免占用过多 localStorage；如需更详细可以扩展
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
  // v0.2
  direction?: Direction              // 'save'（默认）| 'spend'
  // v0.3
  cycleResetDay?: number             // 1..28；仅 spend 模式有意义；undefined = 不重置（一次性预算）
  cycleStartedAt?: number            // 本周期开始时间（spend monthly 模式才填）
  archivedCycles?: ArchivedCycle[]   // 历史周期归档（spend monthly 模式）
  archivedAt?: number                // 已归档（隐藏在首页"已完成"折叠区）的时间；undefined = 未归档
}
