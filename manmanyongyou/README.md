# 慢慢拥有 · manmanyongyou

> 把想要的东西，一格一格点亮。

一个愿望清单式的存钱小工具 MVP。不接银行卡、不接支付、不做记账分析。
只解决一件事：**把目标拆成一格一格，每存一笔，就点亮一格。**

## 快速开始

```bash
cd manmanyongyou
npm install
npm run dev
```

打开 http://localhost:5173 ，移动端宽度（≤430px）体验最佳。

## 技术栈

- React 18 + TypeScript
- Vite 5
- 纯 CSS（手写设计 token）
- localStorage 存储

## 功能

- ✅ 创建目标（名称 / 目标金额 / 每格金额 / 主题 / 图片）
- ✅ 目标列表卡片
- ✅ 点亮格子板（最多 100 格，自适应列数）
- ✅ 存一笔（带备注、新点亮格子有 pop + shimmer 动画）
- ✅ 存钱记录列表
- ✅ 编辑 / 删除目标（带二次确认）
- ✅ 完成时显示「已拥有」状态 + 庆祝条
- ✅ 小红书风分享卡片
- ✅ 数据持久化在 localStorage

## 目录结构

```
manmanyongyou/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css         # 设计 token + 全部样式
    ├── types.ts          # Goal / SavingRecord
    ├── storage.ts        # localStorage 工具
    ├── presets.ts        # 主题、预设图、鼓励语
    └── components/
        ├── HomePage.tsx
        ├── CreateGoalPage.tsx
        ├── GoalDetailPage.tsx
        ├── SaveRecordModal.tsx
        ├── EditGoalModal.tsx
        └── ShareCard.tsx
```

## 数据结构

```ts
interface Goal {
  id: string
  title: string
  targetAmount: number
  savedAmount: number
  unitAmount: number
  image: string
  theme: 'home' | 'travel' | 'tech' | 'beauty' | 'self' | 'appliance' | 'other'
  createdAt: number
  updatedAt: number
  records: SavingRecord[]
}

interface SavingRecord {
  id: string
  amount: number
  note?: string
  createdAt: number
}
```

存于 `localStorage` 的 key：`manmanyongyou.goals.v1`。
