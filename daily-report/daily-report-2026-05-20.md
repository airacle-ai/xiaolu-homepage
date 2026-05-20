# Oprah 项目日报（2026-05-20 ~ 2026-05-21）

## 一、产品分析

### 1.1 从 0→1 产品策略

基于现有 demo 代码，从产品经理视角完成了完整的 0→1 分析，输出文档 `docs/product-0to1-analysis.md`：

- **定位：** AI 对话式自画像 + 关系碰撞工具
- **三层价值链：** AI 对话制造被理解感 → 结构化维度建立可信度 → 关系碰撞完成传播
- **核心缺口：** 表达符号不够强（只有暗号，没有身份标签）、缺乏证据层、问题库耦合在 prompt 中
- **简洁版/详细版方案：** 简洁版 7-8 轮覆盖 12-14 核心维，详细版作为延伸探索

### 1.2 定位框架扩展（五层模型）

后续补全了产品定位，输出文档 `docs/product-strategy-extended.md`：

| 层 | 核心价值 | 关键设计 |
|----|---------|---------|
| 第一层：被理解感 | AI 对话，让用户产生"它懂我"的感觉 | 五幕式对话结构、回声机制、矛盾捕捉 |
| 第二层：可信度 | 结构化维度 + 三级证据 | 证据摘要 → 引用来源 → 反例检查 |
| 第三层：传播 | 关系碰撞 + 身份标签 | 关系名片生成、Canvas 导出 |
| 第四层：行动 | 每个洞察配微小行动 | "试试看"行动建议 + 反馈按钮 |
| 第五层：留存 | 时间轴 + 变化记录 | 跨关系模式发现、反思触达 |

### 1.3 四个补位问题

| 问题 | 解决方案 |
|------|---------|
| 冷启动（朋友不在系统） | 三种碰撞模式：双人完整 / 单人推测 / 公开原型碰撞 |
| 关系分层 | 碰撞前选择关系类型（恋人/密友/家人/同事/刚认识），差异化分析框架和结果布局 |
| 洞察之后"然后呢" | 基于维度差异生成具体行动建议，附带"有用/不适合"反馈 |
| 留存 | 个人时间轴（身份标签演化）、关系时间轴、跨关系模式总结、每周反思提示 |

---

## 二、代码实施（Phase 1-5 全部完成）

### 2.1 数据模型升级

| 文件 | 变更 |
|------|------|
| `src/lib/supabase.ts` | 新增 6 个类型：`StructuredEvidence`、`IdentityLabel`、`ActionHint`、`RelationshipContext`、`AnalysisVersion`；扩展 3 个接口：`DimensionResult`（+identity_label）、`CollisionResult`（+relationship_type/action_hints/relationship_context）、`UserRecord`（+identity_label/analysis_versions） |
| `src/lib/schemas.ts` | `analysisToolSchema` 增加 identity_label + evidence_structured；`collisionToolSchema` 增加 relationship_type + relationship_context + action_hints |

### 2.2 对话体验重写（被理解感）

| 文件 | 变更 |
|------|------|
| `src/lib/claude.ts` | **重写 COACH_SYSTEM_PROMPT：** 五幕式对话结构（入场→展开→转折→收束→揭晓），回声机制（每 2-3 轮确认理解），洞察密度规则（第 2 轮必给命名型洞察），矛盾捕捉三层次（行为/情境/价值），收束仪式（呈现型洞察预告），开场题改为"完全属于你的两天" |
| `src/lib/claude.ts` | **升级 analyzeDimensions prompt：** 输出 identity_label（含主标签 + 修饰标签 + 一句话自述），结构化 evidence_structured（summary/quotes/situation/signal/consistency），确信度三级标记（已探索 70-90 / 推测 40-65 / 未充分探索 20-35） |

### 2.3 身份标签 + 证据层

| 文件 | 变更 |
|------|------|
| `src/components/IdentityLabelHero.tsx` | **新建：** 身份标签 Hero 展示（主标签 + 修饰标签标签云 + 一句话自述 + 暗号复制） |
| `src/components/EvidencePanel.tsx` | **新建：** 三级证据面板（证据摘要 → 具体引用来源 → 反例检查入口 + "提升确信度"/"这不完全对"按钮） |
| `src/components/DisagreePopup.tsx` | **新建：** 三个修正出口（快速调整 / 深度重新探索 / 完全重来） |
| `src/pages/MapPage.tsx` | **重写：** 顶部 IdentityLabelHero 替换旧暗号区；每个维度卡片集成 EvidencePanel；不认同入口触发 DisagreePopup；未完成自我维度带"试试看"行动建议 + 反馈按钮（有用/不适合）；低确信度维度（<40）灰显 50% 透明度 + "继续探索"入口 |
| `src/pages/ChatPage.tsx` | 更新 handleAnalysis/handleRefinement 传递 identityLabel 和 analysis_versions |
| `src/lib/analysis.ts` | runAnalysis 返回 identityLabel，支持 analysis_versions 版本历史 |

### 2.4 冷启动 + 单人体验

| 文件 | 变更 |
|------|------|
| `src/lib/archetypes.ts` | **新建：** 12 个公开原型角色（安全基地型连接者、框架构建型分析者、直觉跳跃型探索者、温柔反叛者、桥梁型调解者、深度潜水者、火花点燃者、沉静观察者、精准提炼者、情绪稳定锚、边界建筑师、意义追寻者），每个含完整 DimensionResult + IdentityLabel + 分类 |
| `src/lib/collision.ts` | **重写：** 支持 6 种关系类型框架注入（恋人/密友/家人/同事/刚认识/原型）；输出 relationship_type 命名 + action_hints 行动建议；新增 `generateSpeculativeCollision` 单人推测碰撞（基于用户对朋友的文字描述推测维度并生成碰撞）；新增 mock 碰撞带关系类型和行动建议 |
| `src/pages/CollisionPage.tsx` | **重写：** 双 Tab 模式（朋友暗号/原型碰撞）；暗号不存在 → 降级为单人推测模式（描述输入框 + 发邀请卡）；原型浏览 + 分类筛选 + 选择和碰撞；碰撞结果按关系类型差异化区块排序（恋人先展示依恋兼容性/密友先展示共鸣区/同事先展示工作方式差异/家人先展示边界冲突）；顶部低确信度维度提示 Banner |

### 2.5 关系名片 + Canvas 导出

| 文件 | 变更 |
|------|------|
| `src/components/InviteCard.tsx` | **重写：** 关系名片弹窗（双方身份标签 × 关系类型 Banner + 角色摘要 + 暗号）；Canvas 渲染导出 PNG 图片到本地 |

### 2.6 简洁版/详细版

| 文件 | 变更 |
|------|------|
| `src/lib/questionBank.ts` | **新建：** 15 道情境题结构化拆出，标注核心题（8 道可直接覆盖全部 19 维）+ 扩展题（7 道用于详细版延伸）；每道题含 id/category/text/dimensions/followUps 字段；提供 `selectNextQuestion` 选题函数 |
| `src/lib/claude.ts` | COACH_SYSTEM_PROMPT 改为简洁版默认：目标 12 维强信号收束（7-8 轮），剩余维度分析时诚实标记为推测/未探索 |

### 2.7 时间轴 + 留存

| 文件 | 变更 |
|------|------|
| `src/pages/TimelinePage.tsx` | **新建：** 当前身份标签展示；分析版本历史演化时间轴（变化检测 + 版本对比）；跨关系模式发现（重复角色检测 + 碰撞点类型统计）；本周反思提示（基于身份标签和演化方向动态生成） |
| `src/App.tsx` | 添加 `/timeline` 路由 |
| `src/components/MainLayout.tsx` | 添加底部"时间轴"Tab 导航 |

---

## 三、关键数据

| 指标 | 数值 |
|------|------|
| 新增文件 | 8 个（IdentityLabelHero, EvidencePanel, DisagreePopup, InviteCard, TimelinePage, archetypes.ts, questionBank.ts, 3 个 docs 文档） |
| 重写文件 | 5 个（claude.ts, collision.ts, MapPage.tsx, CollisionPage.tsx, schemas.ts） |
| 修改文件 | 5 个（supabase.ts, analysis.ts, ChatPage.tsx, App.tsx, MainLayout.tsx） |
| 新增组件 | 6 个 |
| 新增页面 | 1 个（TimelinePage） |
| 公开原型角色 | 12 个 |
| 结构化情境题 | 15 道（8 核心 + 7 扩展） |
| 人格维度 | 19 维（不变） |
| TypeScript 编译 | 零错误 |
| Vite 构建 | 通过（~620KB JS bundle） |

---

## 四、当前状态

```
Phase 1（被理解感+证据层）  ✅ 完成
Phase 2（冷启动+单人体验）  ✅ 完成
Phase 3（碰撞表达升级）    ✅ 完成
Phase 4（行动层）          ✅ 完成
Phase 5（留存+时间轴）     ✅ 完成
简洁版/详细版              ✅ 完成

待部署：Cloudflare Pages（需 API token）
本地可测：localhost:5173（mock 模式）
临时分享：localtunnel 隧道
```
