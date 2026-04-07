import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';
import type { LeafAnalysisResponse } from '../types.js';

const REQUEST_TIMEOUT_MS = 25000;

function defaultAnalysis(): LeafAnalysisResponse {
  return {
    commonName: 'Unknown leaf',
    scientificName: 'Unknown species',
    origin: 'Unknown',
    uses: 'N/A',
    habitat: 'N/A',
    isGrownInCavite: false,
    tags: []
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

function normalizeTextBlock(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const joined = value.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0).join(' ');
    return joined || fallback;
  }

  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function normalizeUsesText(value: unknown): string {
  if (Array.isArray(value)) {
    const bullets = value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => `• ${entry.replace(/^[-•\d.\s]+/, '').trim()}`);

    return bullets.length > 0 ? bullets.join('\n') : 'N/A';
  }

  const rawText = String(value ?? '').trim();
  if (!rawText) {
    return 'N/A';
  }

  const lineBullets = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim());

  if (lineBullets.length >= 2) {
    return lineBullets.map((line) => `• ${line}`).join('\n');
  }

  const semicolonBullets = rawText
    .split(';')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (semicolonBullets.length >= 2) {
    return semicolonBullets.map((line) => `• ${line}`).join('\n');
  }

  const single = rawText.replace(/^[-*\d.\s]+/, '').trim();
  return `• ${single}`;
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
    commonName: normalizeTextBlock(candidate.commonName ?? candidate.common_name, 'Unknown leaf'),
    scientificName: normalizeTextBlock(candidate.scientificName ?? candidate.scientific_name, 'Unknown species'),
    origin: normalizeTextBlock(candidate.origin, 'Unknown'),
    uses: normalizeUsesText(candidate.uses ?? candidate.usage),
    habitat: normalizeTextBlock(candidate.habitat, 'N/A'),
    isGrownInCavite: toBoolean(candidate.isGrownInCavite ?? candidate.is_grown_in_cavite),
    tags: normalizeTags(candidate.tags)
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
    'Analyze this leaf image and provide the information in the following JSON format.',
    'IMPORTANT: Return ONLY the raw JSON object. Do NOT include markdown code blocks, backticks, or any explanation text.',
    'Required format:',
    '{',
    '  "scientificName": "scientific name here",',
    '  "commonName": "common name here",',
    '  "origin": "origin information here",',
    '  "uses": "uses and benefits here",',
    '  "habitat": "where it usually grows with specific location details",',
    '  "tags": ["Tag1", "Tag2", "Tag3"]',
    '}',
    'For "tags", generate 2-5 short category labels that describe this plant\'s primary uses.',
    'Examples: "Medicinal", "Culinary", "Anti-inflammatory", "Immune Booster", "Skin Care",',
    '"Aromatic", "Anti-diabetic", "Ornamental". Use your own judgment based on the plant.',
    'Return only valid JSON with these exact 6 fields, nothing else.'
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
