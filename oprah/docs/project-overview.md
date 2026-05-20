# Oprah 项目理解文档

## 1. 项目概览

这是一个基于 React 的人格探索 demo。用户用 6 位 PIN 进入系统，和名为 Oprah 的 AI coach 对话；对话覆盖 19 个人格/关系维度后，系统调用 LLM 生成“自我地图”和 4 位暗号。用户也可以输入朋友暗号，把两个人的画像交给 LLM 生成“碰撞”关系分析。

当前源码里的大量中文文案呈现为乱码形态，应该是历史导出或编码转换导致的 mojibake；但业务逻辑、文件职责和数据流仍然清晰。

## 2. 技术栈

- 前端框架：React 19、React DOM 19
- 路由：react-router-dom 7
- 构建工具：Vite 8
- 语言：TypeScript
- 样式：Tailwind CSS 4，通过 `@tailwindcss/vite` 接入
- 数据层：Supabase JS v2；未配置真实 Supabase 时回退到浏览器 `localStorage`
- 后端代理：Cloudflare Pages Functions，入口为 `functions/api/llm.ts`
- LLM：TokenRouter / PaleBlueDot 兼容 OpenAI Chat Completions 接口
- 校验/开发：ESLint、typescript-eslint、react-hooks、react-refresh

## 3. 目录结构与文件职责

```text
oprah-demo-main/oprah-demo-main/
├─ index.html                  # Vite HTML 入口
├─ package.json                # 依赖与 npm scripts
├─ vite.config.ts              # Vite + React + Tailwind 插件配置
├─ tsconfig*.json              # TypeScript 配置
├─ eslint.config.js            # ESLint 配置
├─ README.md                   # 本地开发、Pages Function、环境变量说明
├─ functions/api/llm.ts        # 服务端 LLM 代理，隐藏 API key
└─ src/
   ├─ main.tsx                 # React 挂载入口
   ├─ App.tsx                  # 路由表与 UserProvider 包裹
   ├─ index.css                # Tailwind theme、全局样式、动画
   ├─ contexts/
   │  └─ UserContext.tsx       # 当前用户的 React Context
   ├─ pages/
   │  ├─ LoginPage.tsx         # 6 位 PIN 登录/创建用户
   │  ├─ ChatPage.tsx          # Oprah 对话、流式显示、进度、分析触发
   │  ├─ MapPage.tsx           # 自我地图展示、置信度弹窗、继续分析
   │  └─ CollisionPage.tsx     # 输入朋友暗号并生成关系碰撞分析
   ├─ components/
   │  ├─ MainLayout.tsx        # 底部 Tab 布局与登录保护
   │  ├─ ProgressIndicator.tsx # 19 维度进度星图
   │  ├─ ConfidencePopup.tsx   # 置信度解释与“继续提升置信度”入口
   │  ├─ SpectrumBar.tsx       # -100 到 100 价值观滑杆展示
   │  └─ AttachmentChart.tsx   # 依恋风格二维象限图
   └─ lib/
      ├─ supabase.ts           # 类型定义、Supabase/localStorage 数据读写
      ├─ claude.ts             # Oprah 系统提示词、问题库、聊天/分析 LLM 调用
      ├─ analysis.ts           # 生成唯一暗号并保存人格分析结果
      ├─ collision.ts          # 两人关系碰撞 prompt、结果归一化和调用
      ├─ schemas.ts            # 分析与碰撞结果的结构化 schema
      └─ jsonExtract.ts        # 从 LLM 文本中提取首个完整 JSON 对象
```

## 4. 对话流程

1. 用户进入 `/`，在 `LoginPage.tsx` 输入 6 位 PIN。
2. `getUser(pin)` 查询用户；没有则 `createUser(pin)` 新建。
3. 用户写入 `UserContext`，路由跳到 `/chat`。
4. `ChatPage.tsx` 读取 `user.chat_history` 和 `user.progress`。
5. 如果没有历史消息，前端发送一个隐藏触发消息，让 Oprah 生成开场问题。
6. 用户输入文本后，`handleSend()` 把用户消息加入 `messages`，再调用 `triggerOprahResponse()`。
7. `triggerOprahResponse()` 调用 `streamChatMessage()`。
8. `streamChatMessage()` 在真实模式下请求 `/api/llm`，传入：
   - `mode: "chat"`
   - `systemPrompt: COACH_SYSTEM_PROMPT`
   - 当前对话 messages
   - `temperature: 0.8`
9. `functions/api/llm.ts` 在服务端用 TokenRouter API key 请求 `https://api.tokenrouter.com/v1/chat/completions`，返回 assistant 文本。
10. 前端模拟逐字/分块流式显示，完整回复结束后解析隐藏标记：
    - `[DIMS: ...]`：本轮覆盖了哪些维度，更新进度条
    - `[ANALYSIS_READY]`：对话可收束，显示“查看结果”按钮
    - `[REFINEMENT_READY]`：置信度补问完成，显示“查看更新结果”按钮
11. 对话和进度通过 `saveToSupabase()` 保存到 Supabase 或 localStorage。
12. 用户点击分析按钮后，`handleAnalysis()` 调用 `runAnalysis()`。
13. `runAnalysis()` 调用 `analyzeDimensions()`，把完整对话交给 LLM 的 JSON 模式生成 19 维画像。
14. 首次分析会生成唯一 4 位大写字母暗号 `match_code`，并和 `dimensions` 一起保存。
15. 页面跳转 `/map`，`MapPage.tsx` 展示自我地图。

## 5. 问题列表在哪里、如何加载

问题库不在独立文件或数据库中，而是硬编码在 `src/lib/claude.ts` 的 `COACH_SYSTEM_PROMPT` 常量里。

该 prompt 内部包含：

- Oprah 的人格设定和说话风格
- 需要覆盖的 19 个维度
- 对话策略、追问原则、洞察写法
- 进度管理规则
- `[DIMS:]`、`[ANALYSIS_READY]`、`[REFINEMENT_READY]` 标记协议
- “15 个核心情境题”及每题主要覆盖维度和追问方向
- 置信度提升模式的规则

加载方式也很直接：`streamChatMessage()` 每次调用 `/api/llm` 时，把 `COACH_SYSTEM_PROMPT` 作为 `systemPrompt` 传给后端。也就是说，问题库由 LLM 在对话中按 prompt 规则自行选择，不是前端逐题读取、逐题出题。

另有 `demoReplies` 数组用于 `VITE_FORCE_MOCK=1` 的本地 mock 演示，它是固定的短流程回复，不是真正的问题库。

## 6. 结果如何计算

### 自我地图结果

自我地图不是前端用公式计算出来的，而是 LLM 基于完整对话生成结构化 JSON。

核心路径：

```text
ChatPage.handleAnalysis()
→ runAnalysis(user, messages)
→ analyzeDimensions(messages)
→ POST /api/llm { mode: "json", prompt }
→ Cloudflare Function 调 TokenRouter
→ 后端提取 JSON
→ 保存 dimensions + match_code
→ MapPage 展示
```

`analyzeDimensions()` 的 prompt 要求模型输出 19 个维度：

- `thinking_styles`：5 个分类维度
- `values`：5 个 -100 到 100 的价值观光谱
- `relationship_patterns`：5 个关系模式维度，其中依恋风格含 anxiety/avoidance 分数
- `unfinished_self`：4 个开放描述维度
- `overall_portrait`：整体画像
- `evolution_direction`：演化方向

每个维度通常包含：`result` 或 `description`、`confidence`、`evidence`、`insight`。

`runAnalysis()` 还会调用 `generateUniqueMatchCode()` 随机生成 4 位 A-Z 暗号，并通过 `getUserByMatchCode()` 最多尝试 20 次确保唯一。

### 进度结果

进度条不是最终人格结果，只是“对话覆盖度”的可视化。

- LLM 每轮回复末尾附 `[DIMS: key1, key2]`
- `ChatPage.tsx` 用正则解析这些 key，写入 `progress`
- `ProgressIndicator.tsx` 展示 19 个维度点
- 如果模型漏标，`baselineFromTurns()` 会按用户回合数补一个视觉基线，让用户看到稳定推进

### 置信度提升结果

用户在地图页点击某个维度的置信度，会通过 `ConfidencePopup.tsx` 回到 `/chat`，携带 `refineKey/refineLabel`。

`ChatPage.tsx` 追加一条 system 消息，要求 Oprah 围绕目标维度补问 3-4 个不同情境。完成后 `[REFINEMENT_READY]` 触发 `runAnalysis(user, messages, refinement)`。

在 refinement 模式下，`analyzeDimensions()` 的 prompt 要求：只允许更新目标维度，其他 18 个维度原则上逐字保持上一次结果。

### 碰撞结果

碰撞分析同样由 LLM 生成，而不是本地算法评分。

```text
CollisionPage.handleCollision()
→ getUserByMatchCode(friendCode)
→ generateCollision(user.dimensions, friend.dimensions)
→ POST /api/llm { mode: "json", prompt }
→ normalizeCollision()
→ saveCollision()
→ CollisionCard 展示
```

`generateCollision()` 把两个人的 `DimensionResult` 放进碰撞 prompt，要求模型输出：

- `roles_for_a`：对方之于你
- `roles_for_b`：你之于对方
- `collision_points`：碰撞点
- `resonance_zones`：共鸣区
- `friction_warning`：摩擦预警
- `relationship_potential`：关系潜力

`normalizeCollision()` 做防御性清洗：如果模型把对象/数组错误地输出成 JSON 字符串，会尝试解析；如果角色数组过长，会裁剪到 schema 要求的数量。

## 7. 数据存储

### 用户数据

类型定义在 `src/lib/supabase.ts` 的 `UserRecord`：

- `pin_code`：6 位 PIN
- `match_code`：4 位暗号，首次分析后生成
- `chat_history`：聊天记录
- `dimensions`：最终 19 维人格画像
- `progress`：维度覆盖进度
- `created_at` / `updated_at`

真实 Supabase 模式下使用 `users` 表；本地 demo 模式下存入：

```text
localStorage key = oprah:user:{pinCode}
```

### 碰撞数据

类型定义为 `CollisionRecord`：

- `id`
- `user_pin`
- `friend_code`
- `result`
- `created_at`

真实 Supabase 模式下使用 `collisions` 表；本地 demo 模式下存入：

```text
localStorage key = oprah:collisions:{pinCode}
```

### 本地 demo 判定

`supabase.ts` 中的 `USE_LOCAL_DEMO` 根据环境变量判断：如果 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 没配置、仍是占位值或 publishable key 被标为 REDACTED，就使用 localStorage。

另外，`VITE_FORCE_MOCK=1` 会强制 `claude.ts` 和 `collision.ts` 使用本地 mock 回复，不调用真实 LLM。

## 8. 关键函数和组件

- `App()`：定义 `/`、`/chat`、`/map`、`/collision` 路由。
- `UserProvider()` / `useUser()`：保存当前登录用户，供页面共享。
- `LoginPage.handleSubmit()`：校验 PIN，读取或创建用户。
- `ChatPage.triggerOprahResponse()`：聊天主控制器，负责调用 LLM、显示回复、解析标记、保存历史、控制按钮状态。
- `ChatPage.saveToSupabase()`：带队列的保存逻辑，避免并发保存覆盖较新的聊天快照。
- `ChatPage.handleAnalysis()`：触发首次人格分析并跳转地图页。
- `ChatPage.handleRefinement()`：触发目标维度的置信度再分析。
- `streamChatMessage()`：聊天模式 LLM 调用；mock 模式下使用 `demoReplies`。
- `analyzeDimensions()`：构造人格分析 prompt，调用 JSON 模式，并支持 refinement 约束。
- `runAnalysis()`：封装分析、暗号生成和用户记录更新。
- `generateUniqueMatchCode()`：随机生成唯一 4 位 A-Z 暗号。
- `MapPage`：展示 `DimensionResult`，并在缺少结果但已 `[ANALYSIS_READY]` 时允许继续分析。
- `ConfidencePopup`：解释置信度，并将用户带回 ChatPage 进行定向补问。
- `ProgressIndicator`：把真实 `[DIMS:]` 进度和按回合数估算的 baseline 合并展示。
- `CollisionPage.handleCollision()`：校验朋友暗号、读取朋友画像、生成并保存碰撞结果。
- `generateCollision()`：构造两人关系 prompt，调用 LLM，返回结构化碰撞分析。
- `normalizeCollision()`：修复 LLM JSON 结构异常，限制数组长度。
- `onRequestPost()`：Cloudflare Pages Function 入口，统一处理 chat/json 两种 LLM 调用。
- `extractJsonObject()` / `extractJson()`：从 LLM 文本中提取完整 JSON 对象。

## 9. 简化版与详尽版最建议从哪里下手

最建议从 `src/lib/claude.ts` 下手，因为产品体验的复杂度主要集中在 `COACH_SYSTEM_PROMPT`：问题数量、覆盖维度、收束条件、置信度规则、输出长度都在那里定义。

### 做“简化版”

优先改这几处：

1. 缩短 `COACH_SYSTEM_PROMPT` 的 15 个情境题，例如只保留 4-6 个核心场景。
2. 降低收束条件，例如从“至少 15/19 个维度强信号”改为“完成 6-8 轮对话即可收束”。
3. 减少最终 JSON 维度。需要同步改：
   - `src/lib/supabase.ts` 的 `DimensionResult` 类型
   - `src/lib/schemas.ts` 的 `analysisToolSchema`
   - `src/pages/MapPage.tsx` 的展示卡片
   - `src/components/ProgressIndicator.tsx` 的 `FILL_ORDER`、`DIMENSION_GROUPS`、`DOT_POSITIONS`
4. 如果只是 demo 变短，不改数据结构，可以只改 prompt 和 `ProgressIndicator` 的 baseline，让它更快出现 `[ANALYSIS_READY]`。

### 做“详尽版”

也从 `src/lib/claude.ts` 开始，但方向相反：

1. 把问题库从 prompt 中拆成独立模块或 JSON，例如 `src/lib/questionBank.ts`，便于维护、A/B 测试和版本管理。
2. 给每个情境题结构化字段：题目、覆盖维度、追问方向、适用条件、优先级。
3. 让前端或一个 planner 函数显式追踪哪些维度缺证据，再把“下一题建议”传给 LLM，而不是完全让 LLM 自行选择。
4. 强化 `schemas.ts` 的实际使用。目前前端主要依赖 `/api/llm` 的 JSON 模式和 prompt 约束；如果要更稳，可以在后端引入 schema 校验或工具调用式输出。
5. 把置信度提升流程拆成独立状态机：目标维度、已问场景数、反例验证、高压场景、跨域验证，而不是只靠一条 system message 驱动。
6. 为 `dimensions` 和 `collisions` 增加版本字段，避免之后维度 schema 升级导致老数据无法解释。

如果只允许改一个文件，改 `src/lib/claude.ts`；如果要做成可长期迭代的产品，先把问题库和维度 schema 从 prompt 巨块里拆出来，再改 UI 展示。
