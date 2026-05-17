# 日报 · 2026-05-16

## 今日工作内容

### 芽计 YaPlan — 亲子家庭 AI 财务规划工具 🌱

完成芽计 YaPlan 产品从方案设计、原型开发、汇报 PPT 到微信小程序 Demo 的全流程交付。

---

### 一、汇报 PPT 设计与优化（`yaplan-pitch.pptx`）

- 基于提供的模板规范，用 `python-pptx` 程序化生成 **12 页汇报 PPT**
- 页面结构：产品画布 1 页 / 用户需求分析 3 页 / 产品方案设计及原型 7 页 / 关键问题思考 1 页
- **调研招商银行汇报 PPT 审美**，总结其设计语言并完整应用：
  - 主色切换为招行品牌红 `#E2231A`，纯白底色，大量留白
  - 数字超大化（39pt），无边框统计卡片，靠字号大小传达信息权重
  - CMB 平行水平细线装饰语言（源自 logo 解构）
  - 标题下方 1pt 红线分隔，取代重色块
  - 严格字体层级 25 / 17 / 15 / 14 / 12 / 11pt（后整体再 +3pt 调整）
- 将 5 张截图素材（多手机展示 / AI 流程图 / 保险决策树 / 思维导图 / 技术架构）嵌入对应页面
- 全局字号统一 **+3pt**（正文 11pt → 14pt，标题 22pt → 25pt 等）

---

### 二、原型与设计文件（`prototype.html` / `diagrams.html` / `showcase.html`）

- **`prototype.html`**：5 页交互式手机原型（首页 / 规划 / 账单 / AI 对话 / 财商），底部 Tab 全局导航，规划页内置教育金 / 保险二级 Tab
- **`diagrams.html`**：6 张辅助设计图表，含功能思维导图（放射状 SVG）、用户旅程、AI 入户流程图、焦虑检测机制、保险决策树、技术架构
- **`showcase.html`**：5 台手机并排展示页，CSS 悬停动效（translateY + 橙色光晕）

---

### 三、PDF 导出

- `yaplan-pitch.pptx` → **`yaplan-pitch.pdf`**：通过 PowerPoint COM 接口转换，字体完整保留（1.2MB）
- `pitch-deck.html` → **`pitch-deck.pdf`**：原始 HTML 演示文稿仅渲染 1 页，重构为连续排版版本 `pitch-deck-print.html`，通过 Edge Headless 转换为 **12 页连续 PDF**（16:9，13.3" × 7.5"，2.3MB）
- 编写 `convert_to_pdf.ps1` 一键转换脚本（PowerShell）

---

### 四、微信小程序 Demo（`yaplan-miniprogram/`）

新建独立仓库，从零开发完整的微信小程序 Demo，共 **25 个文件，3,496 行代码**：

| 页面 | 核心功能 |
|------|---------|
| 首页 | 时段问候、CSS 圆形健康度进度条（18%）、五色支出条形图、⚠️ 焦虑消费预警 |
| 规划 | Segment 切换教育金 / 保险、双情景测算（国内 ¥45 万 / 出国 ¥120 万）、保单 OCR 入口 |
| 账单 | 月份切换、焦虑消费预警横幅、五色分类条形图、交易列表红绿标签 |
| AI 对话 | 预置 6 条对话气泡、800ms 打字动画「AI 正在思考…」、快捷回复 chips |
| 财商 | 三罐子零花钱（自由 / 储蓄 / 分享）、任务打卡、财商故事 CTA、月度宝贝报告 |

设计系统沿用招商银行审美：主色 `#E2231A`，纯白底，严格字体层级，CMB 风格卡片。

---

### 五、代码托管与同步

- 所有变更持续推送至 GitHub：[airacle-ai/xiaolu-homepage](https://github.com/airacle-ai/xiaolu-homepage)
- 新建仓库并推送小程序代码：[airacle-ai/yaplan-miniprogram](https://github.com/airacle-ai/yaplan-miniprogram)

---

## 产出总结

| 产出物 | 文件 | 说明 |
|--------|------|------|
| 汇报 PPT | `yaplan-pitch.pptx` | 12 页，招商银行风格，python-pptx 生成 |
| PPT PDF | `yaplan-pitch.pdf` | PowerPoint 导出，1.2MB |
| 演示文稿 PDF | `pitch-deck.pdf` | HTML → 12 页连续 PDF，2.3MB |
| 转换脚本 | `convert_to_pdf.ps1` | PowerShell 一键 PPTX → PDF |
| 连续排版 HTML | `pitch-deck-print.html` | 12 张幻灯片线性展开，供打印 |
| 交互原型 | `prototype.html` | 5 页手机原型，可交互 |
| 图表集 | `diagrams.html` | 6 张 SVG 辅助设计图 |
| 手机展示 | `showcase.html` | 5 台手机并排展示 |
| 截图素材 | `screenshot_0~4` | 多手机展示 / AI 流程图 / 决策树 / 思维导图 / 技术架构 |
| 微信小程序 | `yaplan-miniprogram/` | 5 页完整 Demo，3,496 行，独立仓库 |

| 仓库 | 地址 |
|------|------|
| 主仓库 | https://github.com/airacle-ai/xiaolu-homepage |
| 小程序 | https://github.com/airacle-ai/yaplan-miniprogram |
