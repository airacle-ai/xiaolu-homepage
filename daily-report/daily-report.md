# 日报 · 2026-05-15

## 今日工作内容

### 小鹿个人主页上线 🦌

完成了 `xiaolu.airacle.tech` 个人主页的从零搭建到上线全流程。

---

### 一、页面开发

- 设计并编写了个人主页 `index.html`（纯静态，HTML + CSS + JS 一体）
- 整体风格：**深色极简**，以暗黑背景 + 金棕色调为主
- 核心功能与视觉效果：
  - 头像区域带旋转光环动效
  - 背景双色模糊光晕（Ambient Blob）
  - 24 颗金色浮动粒子动画
  - 卡片入场淡入动效
  - 响应式居中布局，适配移动端与桌面端

---

### 二、部署上线（Cloudflare Pages）

- 使用 **Cloudflare Pages 直传方式**（无需连接 GitHub 构建）部署静态页面
- 工具：`wrangler 4.78.0`
- 创建 Pages 项目：`xiaolu`
- 部署成功，临时访问地址：`https://xiaolu-37q.pages.dev`

---

### 三、自定义域名配置

- 目标域名：`xiaolu.airacle.tech`
- 在 Cloudflare DNS 添加 CNAME 记录：
  ```
  xiaolu.airacle.tech  →  xiaolu-37q.pages.dev（Proxied）
  ```
- 通过 Cloudflare Pages API 绑定自定义域名，SSL 证书自动颁发
- 最终访问地址：`https://xiaolu.airacle.tech`

---

### 四、代码托管

- 初始化 Git 仓库，提交全部源码
- 推送至 GitHub：[airacle-ai/xiaolu-homepage](https://github.com/airacle-ai/xiaolu-homepage)
- 分支：`main`

---

## 产出总结

| 项目 | 内容 |
|------|------|
| 开发文件 | `index.html`（含页面、样式、动效） |
| 线上地址 | https://xiaolu.airacle.tech |
| GitHub 仓库 | https://github.com/airacle-ai/xiaolu-homepage |
| 部署平台 | Cloudflare Pages |
| 域名解析 | Cloudflare DNS（CNAME + Proxy） |
