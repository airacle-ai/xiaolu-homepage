export type Theme =
  | 'home'
  | 'travel'
  | 'tech'
  | 'beauty'
  | 'self'
  | 'appliance'
  | 'other'

export interface SavingRecord {
  id: string
  amount: number
  note?: string
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
}
