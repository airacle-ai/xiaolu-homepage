import type { Category, Direction, Theme } from './types'

export const THEMES: { value: Theme; label: string; emoji: string }[] = [
  { value: 'home', label: '买房', emoji: '🏡' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'tech', label: '数码', emoji: '📷' },
  { value: 'beauty', label: '变美', emoji: '💄' },
  { value: 'self', label: '重养自己', emoji: '🌱' },
  { value: 'appliance', label: '家电', emoji: '🛋️' },
  { value: 'other', label: '其他', emoji: '✨' },
]

// 预算模式（spend）用的封面预设——更宁静、抑制消费的画面
const SPEND_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80',
]

export const PRESET_IMAGES: Record<Theme, string[]> = {
  home: [
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  ],
  travel: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1522335789203-aaa7993cb7bb?w=800&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  ],
  self: [
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80',
  ],
  appliance: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  ],
}

export function getCoverImages(direction: Direction, theme: Theme): string[] {
  return direction === 'spend' ? SPEND_COVER_IMAGES : PRESET_IMAGES[theme]
}

// —— v0.2 新增：类目（仅 spend 模式使用，且永远可选）——
export const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'food',    label: '餐饮',     emoji: '🍜', color: '#F08A6E' },
  { value: 'transit', label: '交通',     emoji: '🚇', color: '#8AA98B' },
  { value: 'wear',    label: '衣物美容', emoji: '👗', color: '#F7C77B' },
  { value: 'tech',    label: '数码',     emoji: '💻', color: '#7A95A8' },
  { value: 'home',    label: '居家',     emoji: '🛋️', color: '#C6A78F' },
  { value: 'fun',     label: '娱乐',     emoji: '🎬', color: '#B89BC0' },
  { value: 'other',   label: '其他',     emoji: '✨', color: '#A39A91' },
]

export const CATEGORY_MAP: Record<Category, typeof CATEGORIES[number]> = CATEGORIES.reduce(
  (acc, c) => { acc[c.value] = c; return acc },
  {} as Record<Category, typeof CATEGORIES[number]>,
)

export const ENCOURAGE_QUOTES_SAVE = [
  '慢慢来，也是在靠近。',
  '今天也买下了一点点未来。',
  '不是一下子拥有，是一格一格靠近。',
  '想要的东西，正在被我点亮。',
  '一格一格，把日子过成自己想要的样子。',
  '攒下来的不是钱，是底气。',
]

export const ENCOURAGE_QUOTES_SPEND = [
  '今天没花掉的钱，是悄悄存下的生活。',
  '守住自己的小宇宙。',
  '不被花掉，也是一种拥有。',
  '一格一格守下来，原来这么踏实。',
  '不是少买，是把钱留给真正想要的。',
  '克制，是温柔地对自己负责。',
]

export function pickQuote(direction: Direction, seed: number): string {
  const arr = direction === 'spend' ? ENCOURAGE_QUOTES_SPEND : ENCOURAGE_QUOTES_SAVE
  return arr[seed % arr.length]
}
