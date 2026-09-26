import {
  HUD_SUMMARY_INSTRUCTIONS,
  keylessHudSummaryResponse,
} from '../../../src/hudSummaryResponse.js';
import { enforceOptInRateLimit, openAiRateLimiter } from './rate-limit.js';
import { readRequestBody } from '../common/request.js';
import { OPENAI_HUD_SUMMARY_MODEL_DEFAULT } from './constants.js';

function extractAiResponseText(data) {
  if (typeof data?.choices?.[0]?.message?.content === 'string' && data.choices[0].message.content.trim()) {
    return data.choices[0].message.content.trim();
  }
  if (typeof data?.choices?.[0]?.message?.reasoning_content === 'string' && data.choices[0].message.reasoning_content.trim()) {
    return data.choices[0].message.reasoning_content.trim();
  }
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  if (!Array.isArray(data?.output)) return '';
  return data.output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((part) => part?.text || part?.output_text || '')
    .join(' ')
    .trim();
}

function toFiveWordHudSummary(value) {
  return String(value || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(' ');
}

async function handleHudSummary(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
  const keyless = keylessHudSummaryResponse(apiKey);
  if (keyless) {
    res.statusCode = keyless.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(keyless.payload));
    return;
  }

  // Opt-in per-IP throttle (GEV_RATELIMIT_OPENAI_PER_MIN). Keyless HUD
  // fallback has no provider cost and resolves above without consuming a
  // paid-endpoint quota slot.
  if (!enforceOptInRateLimit(openAiRateLimiter(), req, res)) return;

  try {
    const body = await readRequestBody(req, 64 * 1024);
    const context = JSON.parse(body || '{}');

    const isNvidia = Boolean(process.env.NVIDIA_API_KEY || (process.env.NVIDIA_BASE_URL && apiKey?.startsWith('nvapi-')));
    const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const endpoint = isNvidia
      ? `${baseUrl.replace(/\/+$/, '')}/chat/completions`
      : 'https://api.openai.com/v1/responses';

    const model = isNvidia
      ? (process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash')
      : (process.env.OPENAI_HUD_SUMMARY_MODEL || OPENAI_HUD_SUMMARY_MODEL_DEFAULT);

    const payload = isNvidia
      ? {
          model,
          messages: [
            { role: 'system', content: HUD_SUMMARY_INSTRUCTIONS },
            { role: 'user', content: JSON.stringify(context) },
          ],
          temperature: 0.3,
          max_tokens: 512,
        }
      : {
          model,
          instructions: HUD_SUMMARY_INSTRUCTIONS,
          input: JSON.stringify(context),
          reasoning: { effort: 'minimal' },
          max_output_tokens: 100,
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    const summary = toFiveWordHudSummary(extractAiResponseText(data));
    res.statusCode = response.ok && summary ? 200 : response.status || 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (!response.ok)
      console.warn(`[hud-summary] upstream HTTP ${response.status}`);
    res.end(
      JSON.stringify({
        summary: summary || null,
        // Never relay upstream error message directly
        error: response.ok ? null : `${isNvidia ? 'NVIDIA NIM' : 'OpenAI'} HUD summary request failed`,
      }),
    );
  } catch {
    console.warn('[hud-summary] request failed');
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'HUD summary request failed',
      }),
    );
  }
}

export { handleHudSummary };
