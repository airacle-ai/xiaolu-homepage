# 🎙️ AI 短剧音色库

火山引擎 · 豆包语音合成大模型 · 角色配音工程

> 7 个角色音色 × 3 部短剧 · 一行命令调用官方 SDK 生成配音

---

## 📂 目录结构

```
ai-drama-voice-library/
├── index.html             # 音色库可视化展示页面
├── voice_profiles.json    # 7 个角色完整音色配置
├── .env.example           # 环境变量模板
├── .gitignore             # 屏蔽 .env / 生成音频
├── README.md              # 本文件
├── python/
│   ├── tts_client.py      # 火山官方 TTS 调用脚本
│   └── requirements.txt
└── samples/               # 生成的音频文件（运行后填充）
```

---

## 🎭 角色清单

| ID | 角色 | 剧目 | 标签 |
|----|------|------|------|
| `S_zBsEEuK42` | 苏棠 | 哑绣娘嫁给病弱少东家 | 古风·哑女·气声·心声 |
| `S_yBsEEuK42` | 沈砚白 | 哑绣娘嫁给病弱少东家 | 古风·病弱·书生 |
| `S_xBsEEuK42` | 钱氏 | 哑绣娘嫁给病弱少东家 | 古风·刻薄·反派 |
| `S_wBsEEuK42` | 沈福 | 哑绣娘嫁给病弱少东家 | 古风·老仆·稳重 |
| `S_vBsEEuK42` | 林晚 | 奶奶留给我的钥匙 | 现代·温柔·邻家 |
| `S_vxrEEuK42` | 奶奶 | 奶奶留给我的钥匙 | 现代·老年·颤音 |
| `S_uxrEEuK42` | 大舅妈 | 奶奶留给我的钥匙 | 现代·市井·反派 |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd python/
pip install -r requirements.txt
```

### 2. 配置 API Key + APP_ID

```bash
cd ..
cp .env.example .env
# 编辑 .env，填入两个必填字段：
#   VOLC_TTS_API_KEY   = 豆包语音合成的 access_token
#   VOLC_TTS_APP_ID    = 豆包语音合成的应用 ID
```

> **⚠️ 重要**：本项目的 `S_xxx` 音色是"音色复刻"生成的，必须用豆包原生 API
> （`cluster=volcano_icl`），所以 **APP_ID 是必填的**。
>
> 在 [火山引擎控制台 · 应用管理](https://console.volcengine.com/speech/app) 找到你的应用，
> 复制 App ID 和 Access Token 即可。

### 3. 调用

#### A. 单角色合成（用样例台词）

```bash
python python/tts_client.py --character 苏棠
```

#### B. 单角色合成（自定义文本）

```bash
python python/tts_client.py --character 沈砚白 --text "你怎么知道？"
```

#### C. 按 voice_id 调用

```bash
python python/tts_client.py --voice S_uxrEEuK42 --text "哎哟，晚晚！"
```

#### D. 批量生成所有角色样例

```bash
python python/tts_client.py --batch
# 7 个角色样例音频会输出到 samples/ 目录
```

#### E. 列出所有音色

```bash
python python/tts_client.py --list
```

---

## ⚙️ 后端切换

脚本支持两种火山 API：

| 后端 | 命令参数 | 适用场景 |
|------|---------|---------|
| **豆包原生 API**（默认） | `--backend doubao` | `S_xxx` 音色复刻必须用此接口，需要 API Key + APP_ID |
| **火山方舟（OpenAI 兼容）** | `--backend ark` | 适合**官方内置音色**（如 `BV001_streaming`），不支持 `S_xxx` 复刻音色 |

> 默认使用 `doubao`，本项目 7 个角色全部是音色复刻，必须用 doubao 后端。

---

## 🔧 在自己代码里调用

```python
from python.tts_client import synthesize_character

# 用角色名调用，自动套用预设参数
out = synthesize_character("林晚", text="奶奶，我找到了。")
print(out)  # samples/S_vBsEEuK42_林晚.mp3
```

或直接调用底层函数：

```python
from python.tts_client import synthesize_ark
from pathlib import Path

synthesize_ark(
    text="不必客气。",
    voice_id="S_yBsEEuK42",
    output_path=Path("output.mp3"),
    speed=0.92,
)
```

---

## 📋 音色参数文档

每个角色在 `voice_profiles.json` 里有完整配置：

```json
{
  "id": "S_zBsEEuK42",
  "character": "苏棠",
  "voice_profile": {
    "tone": "清亮少女音",
    "pitch_hz": "220-330",
    "speed": 0.85,
    "style": "气声 / whisper"
  },
  "sample_text": "他不是病，是被你们缝住了魂。",
  "tts_params": {
    "voice_type": "S_zBsEEuK42",
    "speed_ratio": 0.9,
    "pitch_ratio": 1.05,
    "emotion": "sad"
  }
}
```

---

## ⚠️ 安全提示

- **`.env` 文件已加入 `.gitignore`**，永远不要提交真实 API Key
- 如果 Key 已暴露，立即到 [火山引擎控制台](https://console.volcengine.com/) 吊销重生成
- 生成的音频文件不入版本库（也已在 `.gitignore` 屏蔽）

---

## 🔗 相关资源

- [火山方舟 · 语音合成 API 文档](https://www.volcengine.com/docs/82379)
- [豆包语音合成大模型](https://www.volcengine.com/docs/6561)
- [姊妹项目 · ai-drama-scripts](../ai-drama-scripts/) · 完整短剧脚本与策划

---

**版本**: v1.0 · 2026.06
