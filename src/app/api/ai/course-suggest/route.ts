import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.OPENROUTER_API_KEY ?? "";

/**
 * Free vision-capable models confirmed working on OpenRouter (May 2025).
 * Only 4 :free models expose image input — listed best-first.
 *
 * Tested with real base64 JPEGs — all 4 accept image_url content parts.
 * The two Nvidia models respond reliably; Gemma models rate-limit on free tier
 * but are kept as fallback in case quotas refresh.
 *
 * DO NOT add text-only models (e.g. gemma-3-12b-it, llama-3.3-8b) — they
 * cannot process images and will always return an error.
 */
const VISION_MODELS = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", // ✓ Confirmed working
  "nvidia/nemotron-nano-12b-v2-vl:free",                // ✓ Confirmed working
  "google/gemma-4-26b-a4b-it:free",                     // 429 rate-limited but valid fallback
  "google/gemma-4-31b-it:free",                         // 429 rate-limited but valid fallback
];

/** Max time to wait for a single model attempt before aborting it. */
const MODEL_TIMEOUT_MS = 25_000;

/** How long to wait before retrying a 429-rate-limited model (ms). */
const RATE_LIMIT_DELAY_MS = 4_000;

// Diagnostic GET — visit /api/ai/course-suggest to verify this is the
// Next.js Route Handler (not the proxied NestJS backend).
export async function GET() {
  return NextResponse.json({
    ok: true,
    handler: "Next.js Route Handler",
    models: VISION_MODELS,
  });
}

const SYSTEM = `You are an expert online course assistant.
Look at the image carefully and suggest ONLY what you can actually see.
Respond with ONLY a JSON object — no markdown, no text, no code fences.
JSON schema:
{
  "titles": ["4 compelling course titles, each ≤100 chars, all different in approach"],
  "descriptions": ["2 course descriptions, each 10-12 sentences ≤2000 chars, each with a different focus angle"],
  "tagSets": [["8 specific topic tags based on the image"]]
}`;

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function callOpenRouter(model: string, imageBase64: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL ?? "http://localhost:3000",
        "X-Title": "Nexora",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64 }, // base64 data URL — providers handle natively
              },
              {
                type: "text",
                text: "Based on what you see in this thumbnail image, generate 4 distinct variations for course titles,  2 distinct variations for descriptions, and  1 distinct variations for tag sets. Return only JSON matching the schema.",
              },
            ],
          },
        ],
      }),
    });

    const json = await res.json();

    // Surface rate-limit as a specific error type so the caller can handle it
    if (res.status === 429) {
      throw Object.assign(new Error(`429: Rate limited by provider`), { isRateLimit: true });
    }

    if (!res.ok || json?.error) {
      const raw = json?.error?.metadata?.raw ? ` | raw: ${String(json.error.metadata.raw).slice(0, 150)}` : "";
      throw new Error(`HTTP ${res.status}: ${json?.error?.message ?? "provider error"}${raw}`);
    }

    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("Model returned empty content");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export type AISuggestions = {
  titles: string[];
  descriptions: string[];
  tagSets: string[][];
};

function toStrArray(val: unknown, maxLen: number, maxItems: number): string[] {
  if (!Array.isArray(val)) return [];
  return (val as unknown[])
    .map(v => String(v ?? "").trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map(s => s.slice(0, maxLen));
}

function extractJSON(raw: string): AISuggestions {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in response: "${raw.slice(0, 150)}"`);

  const parsed = JSON.parse(match[0]);

  // Parse tagSets — array of arrays
  const rawTagSets = Array.isArray(parsed.tagSets) ? parsed.tagSets : [];
  const tagSets: string[][] = (rawTagSets as unknown[])
    .map(set => toStrArray(set, 40, 10))
    .filter(s => s.length > 0)
    .slice(0, 4);

  return {
    titles:       toStrArray(parsed.titles,       100, 4),
    descriptions: toStrArray(parsed.descriptions, 450, 4),
    tagSets:      tagSets.length > 0 ? tagSets : [],
  };
}

export async function POST(req: NextRequest) {
  if (!KEY || KEY.length < 20 || KEY.includes("replace-with")) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured. Get a free key at https://openrouter.ai/keys and add OPENROUTER_API_KEY=sk-or-v1-... to your .env file." },
      { status: 500 }
    );
  }

  let imageBase64: string;
  try {
    const body = (await req.json()) as { imageBase64?: string };
    if (!body?.imageBase64?.startsWith("data:")) {
      throw new Error("imageBase64 must be a data URL (data:image/...;base64,...)");
    }
    imageBase64 = body.imageBase64;
  } catch {
    return NextResponse.json(
      { error: "Request body must contain { imageBase64: string } where the value is a base64 data URL." },
      { status: 400 }
    );
  }

  const trialErrors: string[] = [];

  for (const model of VISION_MODELS) {
    // Each model gets up to 2 attempts (1 retry on rate-limit)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[course-suggest] Trying ${model} (attempt ${attempt})`);
        const raw  = await callOpenRouter(model, imageBase64);
        const data = extractJSON(raw);

        if (!data.titles.length && !data.descriptions.length && !data.tagSets.length) {
          throw new Error("Parsed JSON had no usable content");
        }

        console.log(`[course-suggest] ✓ Success with model: ${model}`);
        return NextResponse.json({ ...data, _model: model });

      } catch (err: unknown) {
        const e = err as Error & { isRateLimit?: boolean };
        const msg = e.message ?? String(err);

        if (e.isRateLimit && attempt === 1) {
          // Rate-limited — wait briefly and retry this model once before moving on
          console.warn(`[course-suggest] ↺ Rate limit on ${model}, waiting ${RATE_LIMIT_DELAY_MS}ms…`);
          await sleep(RATE_LIMIT_DELAY_MS);
          continue; // retry same model
        }

        console.warn(`[course-suggest] ✗ [${model}] attempt ${attempt}: ${msg}`);
        trialErrors.push(`[${model}] ${msg}`);
        break; // move to next model
      }
    }
  }

  return NextResponse.json(
    {
      error:
        "All vision models failed. This is usually a temporary rate-limit on OpenRouter's free tier — wait 30 seconds and retry.",
      details: trialErrors,
    },
    { status: 502 }
  );
}
