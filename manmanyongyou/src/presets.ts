import type { Theme } from './types'

export const THEMES: { value: Theme; label: string; emoji: string }[] = [
  { value: 'home', label: '买房', emoji: '🏡' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'tech', label: '数码', emoji: '📷' },
  { value: 'beauty', label: '变美', emoji: '💄' },
  { value: 'self', label: '重养自己', emoji: '🌱' },
  { value: 'appliance', label: '家电', emoji: '🛋️' },
  { value: 'other', label: '其他', emoji: '✨' },
]

// 使用 Unsplash 直链图片，覆盖每个主题
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

export const ENCOURAGE_QUOTES = [
  '慢慢来，也是在靠近。',
  '今天也买下了一点点未来。',
  '不是一下子拥有，是一格一格靠近。',
  '想要的东西，正在被我点亮。',
  '一格一格，把日子过成自己想要的样子。',
  '攒下来的不是钱，是底气。',
]

export function pickQuote(seed: number): string {
  return ENCOURAGE_QUOTES[seed % ENCOURAGE_QUOTES.length]
}
