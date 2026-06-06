/**
 * 火山引擎 · 豆包 TTS Cloudflare Worker 代理
 * =========================================
 *
 * 用途：让前端浏览器无需暴露 API Key 就能直接试听音色
 *
 * Secret 配置（Cloudflare 控制台 / wrangler secret put）：
 *   - VOLC_TTS_API_KEY          必填，火山方舟 API Key
 *   - VOLC_TTS_APP_ID           可选，使用豆包原生API时需要
 *   - VOLC_TTS_MODEL            可选，默认 doubao-seed-tts-250715
 *   - ALLOWED_ORIGIN            可选，限定来源（如 https://xiaolu.airacle.tech）
 *
 * 路由：
 *   GET  /              健康检查 / 文档
 *   GET  /voices        返回音色配置 JSON（公开）
 *   POST /synthesize    合成音频（核心接口）
 *
 * POST /synthesize 请求体：
 * {
 *   "text": "要合成的文本",
 *   "voice": "S_zBsEEuK42",     // voice_id
 *   "speed": 0.9,                // 可选 0.5 - 2.0
 *   "backend": "ark"             // 可选 "ark"（默认）或 "doubao"
 * }
 *
 * 响应：audio/mpeg 二进制音频，可直接给 <audio src> 用
 */

const ARK_TTS_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/audio/speech";
const DOUBAO_TTS_ENDPOINT = "https://openspeech.bytedance.com/api/v1/tts";

// 内嵌音色白名单 —— 防止 Worker 被滥用调用任意 voice
const ALLOWED_VOICES = new Set([
  "S_zBsEEuK42",  // 苏棠
  "S_yBsEEuK42",  // 沈砚白
  "S_xBsEEuK42",  // 钱氏
  "S_wBsEEuK42",  // 沈福
  "S_vBsEEuK42",  // 林晚
  "S_vxrEEuK42",  // 奶奶
  "S_uxrEEuK42",  // 大舅妈
]);

// 限制单次文本长度
const MAX_TEXT_LENGTH = 500;

// ----------------------------------------------------------------------------
//  CORS
// ----------------------------------------------------------------------------

function corsHeaders(env, request) {
  const origin = request.headers.get("Origin") || "*";
  const allowed = env.ALLOWED_ORIGIN
    ? (origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN)
    : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(obj, init = {}, env = {}, request = {}) {
  return new Response(JSON.stringify(obj), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, request),
      ...(init.headers || {}),
    },
  });
}

// ----------------------------------------------------------------------------
//  Backend: ark (OpenAI 兼容)
// ----------------------------------------------------------------------------

async function synthesizeArk({ text, voice, speed, env }) {
  const model = env.VOLC_TTS_MODEL || "doubao-seed-tts-250715";

  const payload = {
    model,
    input: text,
    voice,
    response_format: "mp3",
    speed: speed || 1.0,
  };

  const resp = await fetch(ARK_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.VOLC_TTS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Ark TTS ${resp.status}: ${errText}`);
  }
  return resp;
}

// ----------------------------------------------------------------------------
//  Backend: doubao (原生)
// ----------------------------------------------------------------------------

async function synthesizeDoubao({ text, voice, speed, env }) {
  if (!env.VOLC_TTS_APP_ID) {
    throw new Error("豆包原生 API 需要 VOLC_TTS_APP_ID secret");
  }
  const reqid = crypto.randomUUID();

  const payload = {
    app: {
      appid: env.VOLC_TTS_APP_ID,
      token: env.VOLC_TTS_API_KEY,
      cluster: "volcano_icl",
    },
    user: { uid: "ai-drama-voice-lib-worker" },
    audio: {
      voice_type: voice,
      encoding: "mp3",
      speed_ratio: speed || 1.0,
    },
    request: {
      reqid,
      text,
      operation: "query",
    },
  };

  const resp = await fetch(DOUBAO_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer;${env.VOLC_TTS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();
  if (data.code !== 3000) {
    throw new Error(`豆包 TTS code=${data.code}: ${data.message || JSON.stringify(data)}`);
  }

  // doubao 返回 base64，需要解码
  const audioBytes = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
  return new Response(audioBytes, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg" },
  });
}

// ----------------------------------------------------------------------------
//  Main fetch handler
// ----------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    // Health check / docs
    if (url.pathname === "/" || url.pathname === "") {
      return jsonResponse({
        name: "AI Drama Voice Library · TTS Proxy",
        provider: "火山引擎 · 豆包语音合成大模型",
        endpoints: {
          "GET /": "health check (this page)",
          "GET /voices": "list allowed voice IDs",
          "POST /synthesize": "synthesize audio: { text, voice, speed?, backend? }",
        },
        version: "1.0",
      }, {}, env, request);
    }

    // Public voices endpoint
    if (url.pathname === "/voices" && request.method === "GET") {
      return jsonResponse({
        voices: Array.from(ALLOWED_VOICES),
        count: ALLOWED_VOICES.size,
      }, {}, env, request);
    }

    // TTS synthesis
    if (url.pathname === "/synthesize" && request.method === "POST") {
      if (!env.VOLC_TTS_API_KEY) {
        return jsonResponse(
          { error: "Server misconfigured: missing VOLC_TTS_API_KEY secret" },
          { status: 500 }, env, request
        );
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, { status: 400 }, env, request);
      }

      // 默认走 doubao 后端（音色复刻 S_xxx 必用）
      const { text, voice, speed, backend = "doubao" } = body || {};

      // Validation
      if (!text || typeof text !== "string") {
        return jsonResponse({ error: "Missing 'text' field" }, { status: 400 }, env, request);
      }
      if (text.length > MAX_TEXT_LENGTH) {
        return jsonResponse(
          { error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` },
          { status: 400 }, env, request
        );
      }
      if (!voice || !ALLOWED_VOICES.has(voice)) {
        return jsonResponse(
          { error: "Invalid or unauthorized 'voice' ID", allowed: Array.from(ALLOWED_VOICES) },
          { status: 400 }, env, request
        );
      }
      if (speed !== undefined && (typeof speed !== "number" || speed < 0.5 || speed > 2.0)) {
        return jsonResponse({ error: "speed must be 0.5 - 2.0" }, { status: 400 }, env, request);
      }

      try {
        let upstream;
        if (backend === "ark") {
          upstream = await synthesizeArk({ text, voice, speed, env });
        } else {
          // doubao（默认）—— 必须配置 APP_ID
          if (!env.VOLC_TTS_APP_ID) {
            return jsonResponse(
              { error: "Server misconfigured: missing VOLC_TTS_APP_ID secret (S_xxx voices require doubao backend with APP_ID)" },
              { status: 500 }, env, request
            );
          }
          upstream = await synthesizeDoubao({ text, voice, speed, env });
        }

        // Stream-back audio
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
            ...corsHeaders(env, request),
          },
        });
      } catch (e) {
        return jsonResponse(
          { error: "Upstream TTS failed", detail: String(e.message || e) },
          { status: 502 }, env, request
        );
      }
    }

    return jsonResponse({ error: "Not found" }, { status: 404 }, env, request);
  },
};
