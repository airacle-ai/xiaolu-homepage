# 🌩️ TTS Cloudflare Worker 代理

让前端浏览器直接试听音色，无需暴露 API Key、无需本地跑 Python。

---

## 架构

```
浏览器  ──POST /synthesize──▶  Cloudflare Worker  ──Bearer key──▶  火山引擎 TTS
   ◀──────── audio/mpeg ────────         ◀──────── audio/mpeg ────────
```

API Key 作为 Cloudflare Secret 存放，前端代码里**完全不出现**。

---

## 部署步骤

### 1. 安装 wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. 配置 Secret

```bash
cd ai-drama-voice-library/worker
wrangler secret put VOLC_TTS_API_KEY    # 豆包语音合成 access_token
wrangler secret put VOLC_TTS_APP_ID      # 豆包语音合成 应用ID（必填）
```

> **⚠️ 重要**：本项目的 `S_xxx` 音色是"音色复刻"生成的，必须用豆包原生 API
> （`cluster=volcano_icl`），所以 **两个 Secret 都是必填的**。
>
> 在 [火山引擎控制台 · 应用管理](https://console.volcengine.com/speech/app) 获取。

### 3. 部署

```bash
wrangler deploy
```

部署后会返回类似 `https://ai-drama-voice-tts.<your-subdomain>.workers.dev` 的地址。

### 4. 把 Worker 地址告诉前端

打开 `ai-drama-voice-library/index.html`，搜索 `TTS_WORKER_URL`，替换为你部署的地址即可。

---

## API 端点

### `GET /`

健康检查 + 文档。

### `GET /voices`

返回白名单内允许调用的 voice_id 列表。

```json
{
  "voices": ["S_zBsEEuK42", "S_yBsEEuK42", "..."],
  "count": 7
}
```

### `POST /synthesize`

合成音频，返回 `audio/mpeg` 二进制流。

请求体：

```json
{
  "text": "他不是病，是被你们缝住了魂。",
  "voice": "S_zBsEEuK42",
  "speed": 0.9,
  "backend": "ark"
}
```

字段说明：

| 字段 | 必填 | 说明 |
|------|------|------|
| `text` | ✅ | 要合成的文本，最长 500 字符 |
| `voice` | ✅ | voice_id，必须在白名单内 |
| `speed` | | 0.5 - 2.0，默认 1.0 |
| `backend` | | `ark`（默认）或 `doubao` |

错误响应示例：

```json
{ "error": "Invalid or unauthorized 'voice' ID", "allowed": [...] }
```

---

## 安全设计

- ✅ API Key 仅存于 Cloudflare Secret，永不进前端代码
- ✅ Voice ID **白名单**校验，防止滥用调任意音色
- ✅ 文本长度上限 500 字符，控制成本
- ✅ 可选 `ALLOWED_ORIGIN` 限定来源域名（生产环境推荐开启）
- ✅ 速度参数范围校验（0.5 - 2.0）

---

## 本地调试

```bash
wrangler dev
# 启动后访问 http://localhost:8787/voices 测试
```

测试合成：

```bash
curl -X POST http://localhost:8787/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"测试","voice":"S_zBsEEuK42"}' \
  --output test.mp3 && open test.mp3
```

---

## 成本估算

火山引擎 TTS 按字符计费，单字符约 ¥0.0001-0.0002。
单次试听 50 字符约 ¥0.005-0.01。
Cloudflare Worker 免费额度：每天 10 万次请求，足够前端试听场景使用。
