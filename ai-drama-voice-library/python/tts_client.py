"""
火山引擎 · 豆包语音合成大模型 TTS 客户端
======================================
依赖：requests, python-dotenv

支持两种调用方式：
  1. 火山方舟兼容 OpenAI 格式接口（推荐 · 简单）
  2. 火山豆包语音合成原生 HTTP API（高级 · 支持音色复刻等参数）

用法示例：
  python tts_client.py --character 苏棠 --text "他不是病，是被你们缝住了魂。"
  python tts_client.py --voice S_zBsEEuK42 --text "测试文本" --out test.mp3
  python tts_client.py --batch  # 批量生成所有角色的样例台词
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    sys.exit("请先安装依赖: pip install requests python-dotenv")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv 可选


# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

# 必需的环境变量
API_KEY = os.environ.get("VOLC_TTS_API_KEY", "")
APP_ID = os.environ.get("VOLC_TTS_APP_ID", "")  # 豆包原生 API 需要

# API endpoints
ARK_TTS_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/audio/speech"
DOUBAO_TTS_ENDPOINT = "https://openspeech.bytedance.com/api/v1/tts"

# 音色配置文件
ROOT = Path(__file__).resolve().parent.parent
VOICE_PROFILES_PATH = ROOT / "voice_profiles.json"
SAMPLES_DIR = ROOT / "samples"


# ---------------------------------------------------------------------------
# 音色配置加载
# ---------------------------------------------------------------------------

def load_voices() -> list[dict]:
    with open(VOICE_PROFILES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["voices"]


def find_voice(query: str) -> Optional[dict]:
    """按 voice_id 或 character 名称查找音色"""
    voices = load_voices()
    for v in voices:
        if v["id"] == query or v["character"] == query:
            return v
    return None


# ---------------------------------------------------------------------------
# 方式一：火山方舟兼容 OpenAI 接口（推荐）
# ---------------------------------------------------------------------------

def synthesize_ark(text: str, voice_id: str, output_path: Path,
                   model: str = "doubao-seed-tts-250715",
                   speed: float = 1.0) -> Path:
    """
    用火山方舟兼容 OpenAI 格式接口生成语音
    Authorization: Bearer <API_KEY>
    """
    if not API_KEY:
        raise RuntimeError("缺少 VOLC_TTS_API_KEY 环境变量；请参考 .env.example 配置")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "input": text,
        "voice": voice_id,
        "response_format": "mp3",
        "speed": speed,
    }

    print(f"[ark] POST {ARK_TTS_ENDPOINT}")
    print(f"      voice={voice_id} speed={speed} text={text[:30]}...")
    resp = requests.post(ARK_TTS_ENDPOINT, headers=headers,
                         data=json.dumps(payload), timeout=60)
    if resp.status_code != 200:
        raise RuntimeError(f"TTS 请求失败 [{resp.status_code}]: {resp.text}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(resp.content)
    print(f"  ✅ 写入 {output_path} ({len(resp.content)/1024:.1f} KB)")
    return output_path


# ---------------------------------------------------------------------------
# 方式二：豆包语音合成原生 HTTP API
# ---------------------------------------------------------------------------

def synthesize_doubao(text: str, voice_id: str, output_path: Path,
                      speed_ratio: float = 1.0,
                      pitch_ratio: float = 1.0,
                      volume_ratio: float = 1.0,
                      emotion: Optional[str] = None,
                      cluster: str = "volcano_icl") -> Path:
    """
    豆包原生 API（音色复刻 S_xxx 类型必须用此接口）
    Authorization: Bearer;<API_KEY>   注意分号分隔
    cluster: volcano_icl（音色复刻ICL1.0） / volcano_tts（标准）
    """
    if not API_KEY:
        raise RuntimeError("缺少 VOLC_TTS_API_KEY 环境变量")
    if not APP_ID:
        raise RuntimeError(
            "豆包原生 API 需要 APP_ID。\n"
            "请到 https://console.volcengine.com/speech/app 找到你的「应用ID」，\n"
            "然后在 .env 里加 VOLC_TTS_APP_ID=xxxxxx"
        )

    headers = {
        "Authorization": f"Bearer;{API_KEY}",
        "Content-Type": "application/json",
    }
    audio_config = {
        "voice_type": voice_id,
        "encoding": "mp3",
        "speed_ratio": speed_ratio,
        "pitch_ratio": pitch_ratio,
        "volume_ratio": volume_ratio,
    }
    if emotion:
        audio_config["emotion"] = emotion

    payload = {
        "app": {"appid": APP_ID, "token": API_KEY, "cluster": cluster},
        "user": {"uid": "ai-drama-voice-lib"},
        "audio": audio_config,
        "request": {
            "reqid": str(uuid.uuid4()),
            "text": text,
            "operation": "query",
        },
    }

    print(f"[doubao] POST {DOUBAO_TTS_ENDPOINT}")
    print(f"         voice={voice_id} text={text[:30]}...")
    resp = requests.post(DOUBAO_TTS_ENDPOINT, headers=headers,
                         json=payload, timeout=60)
    data = resp.json()
    if data.get("code") != 3000:
        raise RuntimeError(f"豆包 TTS 失败: {data}")

    audio_b64 = data.get("data", "")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(base64.b64decode(audio_b64))
    print(f"  ✅ 写入 {output_path} ({output_path.stat().st_size/1024:.1f} KB)")
    return output_path


# ---------------------------------------------------------------------------
# 高层入口
# ---------------------------------------------------------------------------

def synthesize_character(character_or_id: str, text: Optional[str] = None,
                         backend: str = "doubao") -> Path:
    """根据 character 名/voice_id 自动选择参数并合成

    backend 默认 doubao —— S_xxx 音色复刻必须用此接口
    """
    voice = find_voice(character_or_id)
    if not voice:
        raise ValueError(f"未找到角色或音色: {character_or_id}")

    text = text or voice["sample_text"]
    params = voice["tts_params"]
    safe_name = voice["character"].replace("·", "_")
    out_path = SAMPLES_DIR / f"{voice['id']}_{safe_name}.mp3"

    if backend == "ark":
        return synthesize_ark(
            text=text, voice_id=voice["id"], output_path=out_path,
            speed=params.get("speed_ratio", 1.0),
        )
    else:
        return synthesize_doubao(
            text=text, voice_id=voice["id"], output_path=out_path,
            speed_ratio=params.get("speed_ratio", 1.0),
            pitch_ratio=params.get("pitch_ratio", 1.0),
            volume_ratio=params.get("volume_ratio", 1.0),
            emotion=params.get("emotion"),
        )


def batch_generate_samples(backend: str = "doubao") -> None:
    """为所有角色生成样例台词音频"""
    voices = load_voices()
    print(f"开始批量生成 {len(voices)} 个角色样例 (backend={backend})...\n")
    failed = []
    for v in voices:
        try:
            synthesize_character(v["id"], backend=backend)
        except Exception as e:
            print(f"  ❌ {v['character']} 失败: {e}")
            failed.append((v["character"], str(e)))
    print(f"\n完成。成功 {len(voices)-len(failed)}/{len(voices)}")
    if failed:
        print("失败列表:")
        for n, e in failed:
            print(f"  - {n}: {e}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="火山引擎 · 豆包 TTS 客户端 · AI 短剧音色库"
    )
    parser.add_argument("--character", "-c", help="角色名（如：苏棠）")
    parser.add_argument("--voice", "-v", help="音色 ID（如：S_zBsEEuK42）")
    parser.add_argument("--text", "-t", help="要合成的文本；不传则用样例台词")
    parser.add_argument("--out", "-o", help="输出文件路径；不传则用默认路径")
    parser.add_argument("--backend", choices=["ark", "doubao"], default="doubao",
                        help="使用的后端：doubao=豆包原生API（默认，S_xxx音色复刻必用），ark=方舟兼容OpenAI接口")
    parser.add_argument("--batch", action="store_true",
                        help="批量为所有角色生成样例")
    parser.add_argument("--list", action="store_true",
                        help="列出所有音色")
    args = parser.parse_args()

    if args.list:
        voices = load_voices()
        print(f"\n共 {len(voices)} 个音色：\n")
        for v in voices:
            print(f"  [{v['id']}]  {v['character']:8s}  ({v['role']})")
            print(f"    剧目: {v['drama']}")
            print(f"    样例: {v['sample_text']}\n")
        return

    if args.batch:
        batch_generate_samples(backend=args.backend)
        return

    query = args.character or args.voice
    if not query:
        parser.error("请指定 --character 或 --voice，或使用 --batch / --list")

    out_path = synthesize_character(query, text=args.text, backend=args.backend)
    print(f"\n🎵 完成: {out_path}")


if __name__ == "__main__":
    main()
