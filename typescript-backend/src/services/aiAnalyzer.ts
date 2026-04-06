import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';
import type { LeafAnalysisResponse, LeafReference } from '../types.js';

const REQUEST_TIMEOUT_MS = 25000;

function defaultAnalysis(): LeafAnalysisResponse {
  return {
    commonName: 'Unknown leaf',
    scientificName: 'Unknown species',
    origin: 'Unknown',
    uses: 'N/A',
    habitat: 'N/A',
    isGrownInCavite: false,
    tags: [],
    references: []
  };
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text: unknown }).text ?? '');
        }
        return '';
      })
      .join('\n');
  }

  return '';
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return raw.trim();
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === 'yes' || normalized === '1';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

function normalizeReferences(value: unknown): LeafReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((ref) => {
      if (typeof ref === 'string') {
        return { url: ref, title: ref };
      }

      if (ref && typeof ref === 'object') {
        const candidate = ref as { url?: unknown; title?: unknown };
        const url = String(candidate.url ?? '').trim();
        const title = String(candidate.title ?? url).trim();
        if (!url) {
          return null;
        }
        return { url, title: title || url };
      }

      return null;
    })
    .filter((ref): ref is LeafReference => Boolean(ref));
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .map((tag) => String(tag).trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      const lowered = tag.toLowerCase();
      if (seen.has(lowered)) {
        return false;
      }
      seen.add(lowered);
      return true;
    });
}

function normalizeAnalysis(value: unknown): LeafAnalysisResponse {
  if (!value || typeof value !== 'object') {
    return defaultAnalysis();
  }

  const candidate = value as Record<string, unknown>;

  return {
    commonName: String(candidate.commonName ?? candidate.common_name ?? 'Unknown leaf'),
    scientificName: String(candidate.scientificName ?? candidate.scientific_name ?? 'Unknown species'),
    origin: String(candidate.origin ?? 'Unknown'),
    uses: String(candidate.uses ?? candidate.usage ?? 'N/A'),
    habitat: String(candidate.habitat ?? 'N/A'),
    isGrownInCavite: toBoolean(candidate.isGrownInCavite ?? candidate.is_grown_in_cavite),
    tags: normalizeTags(candidate.tags),
    references: normalizeReferences(candidate.references)
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function analyzeLeafImage(image: Buffer, mimeType: string): Promise<LeafAnalysisResponse> {
  if (!env.geminiApiKey || !env.geminiModel) {
    return defaultAnalysis();
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  const prompt = [
    'Analyze the plant leaf image and return only a valid JSON object with this exact shape:',
    '{',
    '  "commonName": "string",',
    '  "scientificName": "string",',
    '  "origin": "string",',
    '  "uses": "string",',
    '  "habitat": "string",',
    '  "isGrownInCavite": true,',
    '  "tags": ["string"],',
    '  "references": [{"url": "https://...", "title": "string"}]',
    '}',
    'Do not include markdown, explanation, or extra keys.'
  ].join('\n');

  const imageBase64 = image.toString('base64');

  try {
    const payload = await withTimeout(
      ai.models.generateContent({
        model: env.geminiModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ]
      }),
      REQUEST_TIMEOUT_MS
    );

    const textFromPayload = typeof payload.text === 'string' ? payload.text : '';
    const content = textFromPayload || extractTextContent((payload as { candidates?: unknown[] }).candidates ?? []);
    if (!content) {
      return defaultAnalysis();
    }

    const jsonText = extractJson(content);
    const parsed = JSON.parse(jsonText) as unknown;
    return normalizeAnalysis(parsed);
  } catch {
    return defaultAnalysis();
  }
}
