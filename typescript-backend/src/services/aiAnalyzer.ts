import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { env } from '../env.js';
import type { AnalysisReference, LeafAnalysisResponse } from '../types.js';

const NON_PLANT_TERMS = [
  'not a plant',
  'non plant',
  'non-plant',
  'not plant',
  'not a leaf',
  'not a leaf image',
  'no plant',
  'no leaf',
  'does not contain a plant',
  'does not appear to be a plant',
  'cannot identify plant',
  'cannot identify a plant',
  'not applicable',
  'outside domain'
];

const STANDARD_NON_PLANT_RESPONSE: LeafAnalysisResponse = {
  commonName: 'Not a plant',
  scientificName: 'Not a plant',
  origin: 'N/A',
  uses: 'N/A',
  habitat: 'N/A',
  confidenceScore: 0,
  confidenceLabel: 'Low',
  keyCharacteristics: ['Image does not appear to contain a plant leaf.'],
  careTips: 'Retake the photo with a single clear leaf in frame and good lighting.',
  safetyNotes: 'Do not consume unknown specimens without expert confirmation.',
  identificationNotes: 'The uploaded image does not appear to be a plant/leaf photo.',
  isGrownInCavite: false,
  tags: ['Not a Plant'],
  references: []
};

interface GroundingChunkLike {
  web?: { uri?: unknown; title?: unknown; domain?: unknown };
  image?: { sourceUri?: unknown; title?: unknown; domain?: unknown };
  retrievedContext?: { uri?: unknown; title?: unknown };
  maps?: { uri?: unknown; title?: unknown };
}

function normalizeReferenceUri(value: unknown): string | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeReferenceTitle(value: unknown, fallbackUri: string): string {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized) {
    return normalized;
  }

  try {
    return new URL(fallbackUri).hostname;
  } catch {
    return 'Reference';
  }
}

function normalizeReferenceDomain(value: unknown, uri: string): string | undefined {
  const fromValue = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (fromValue) {
    return fromValue;
  }

  try {
    return new URL(uri).hostname;
  } catch {
    return undefined;
  }
}

function createReference(params: { uri: unknown; title?: unknown; domain?: unknown }): AnalysisReference | undefined {
  const normalizedUri = normalizeReferenceUri(params.uri);
  if (!normalizedUri) {
    return undefined;
  }

  return {
    title: normalizeReferenceTitle(params.title, normalizedUri),
    uri: normalizedUri,
    domain: normalizeReferenceDomain(params.domain, normalizedUri)
  };
}

function isGroundingRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.hostname === 'vertexaisearch.cloud.google.com' && parsed.pathname.startsWith('/grounding-api-redirect/');
  } catch {
    return false;
  }
}

function withTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return controller.signal;
}

async function resolveGroundingRedirectUri(uri: string): Promise<string> {
  if (!isGroundingRedirectUri(uri)) {
    return uri;
  }

  try {
    const headResponse = await fetch(uri, {
      method: 'HEAD',
      redirect: 'follow',
      signal: withTimeoutSignal(3000)
    });

    const normalized = normalizeReferenceUri(headResponse.url);
    if (normalized) {
      return normalized;
    }
  } catch {
    // Some sources reject HEAD; fallback to GET below.
  }

  try {
    const getResponse = await fetch(uri, {
      method: 'GET',
      redirect: 'follow',
      signal: withTimeoutSignal(4000)
    });

    const normalized = normalizeReferenceUri(getResponse.url);
    if (normalized) {
      return normalized;
    }
  } catch {
    return uri;
  }

  return uri;
}

async function extractGroundingReferences(payload: unknown): Promise<AnalysisReference[]> {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const response = payload as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: GroundingChunkLike[];
      };
    }>;
  };

  const references: AnalysisReference[] = [];
  const seen = new Set<string>();

  for (const candidate of response.candidates ?? []) {
    for (const chunk of candidate.groundingMetadata?.groundingChunks ?? []) {
      const chunkReferences = [
        createReference({ uri: chunk.web?.uri, title: chunk.web?.title, domain: chunk.web?.domain }),
        createReference({ uri: chunk.image?.sourceUri, title: chunk.image?.title, domain: chunk.image?.domain }),
        createReference({ uri: chunk.retrievedContext?.uri, title: chunk.retrievedContext?.title }),
        createReference({ uri: chunk.maps?.uri, title: chunk.maps?.title })
      ].filter((entry): entry is AnalysisReference => Boolean(entry));

      for (const reference of chunkReferences) {
        const dedupeKey = reference.uri.toLowerCase();
        if (seen.has(dedupeKey)) {
          continue;
        }

        seen.add(dedupeKey);
        references.push(reference);
      }
    }
  }

  const resolved = await Promise.all(
    references.slice(0, 8).map(async (reference) => {
      const resolvedUri = await resolveGroundingRedirectUri(reference.uri);
      return {
        ...reference,
        uri: resolvedUri,
        domain: normalizeReferenceDomain(reference.domain, resolvedUri)
      };
    })
  );

  const deduped: AnalysisReference[] = [];
  const resolvedSeen = new Set<string>();

  for (const reference of resolved) {
    const key = reference.uri.toLowerCase();
    if (resolvedSeen.has(key)) {
      continue;
    }

    resolvedSeen.add(key);
    deduped.push(reference);
  }

  return deduped;
}

function shouldRetryWithoutGrounding(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('google search') ||
    message.includes('google_search') ||
    message.includes('grounding') ||
    message.includes('tool') ||
    message.includes('unsupported')
  );
}

function normalizeForMatching(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hasNonPlantTerm(value: unknown): boolean {
  const normalized = normalizeForMatching(value);
  if (!normalized) {
    return false;
  }

  return NON_PLANT_TERMS.some((term) => normalized.includes(term));
}

function isNonPlantAnalysisCandidate(candidate: Record<string, unknown>): boolean {
  if (candidate.isPlant === false || candidate.isLeaf === false || candidate.isApplicable === false) {
    return true;
  }

  const textSignals = [
    candidate.commonName,
    candidate.common_name,
    candidate.scientificName,
    candidate.scientific_name,
    candidate.identificationNotes,
    candidate.identification_notes,
    candidate.origin,
    candidate.habitat
  ];

  if (textSignals.some((value) => hasNonPlantTerm(value))) {
    return true;
  }

  if (Array.isArray(candidate.tags) && candidate.tags.some((value) => hasNonPlantTerm(value))) {
    return true;
  }

  return false;
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

function requireTextBlock(value: unknown, fieldName: string): string {
  const text = normalizeTextBlock(value, '').trim();
  if (!text) {
    throw new Error(`AI response missing required field: ${fieldName}`);
  }

  return text;
}

function requireConfidenceScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error('AI response missing required field: confidenceScore');
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function requireConfidenceLabel(value: unknown): string {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  throw new Error('AI response missing required field: confidenceLabel');
}

function requireStringList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`AI response missing required field: ${fieldName}`);
  }

  const unique = new Set<string>();
  const items = value
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0)
    .filter((entry) => {
      const lowered = entry.toLowerCase();
      if (unique.has(lowered)) {
        return false;
      }
      unique.add(lowered);
      return true;
    });

  if (items.length === 0) {
    throw new Error(`AI response missing required field: ${fieldName}`);
  }

  return items;
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
    throw new Error('AI response missing required field: tags');
  }

  const seen = new Set<string>();

  const tags = value
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

  if (tags.length === 0) {
    throw new Error('AI response missing required field: tags');
  }

  return tags;
}

function normalizeAnalysis(value: unknown, references: AnalysisReference[]): LeafAnalysisResponse {
  if (!value || typeof value !== 'object') {
    throw new Error('AI response is not a valid JSON object.');
  }

  const candidate = value as Record<string, unknown>;

  if (isNonPlantAnalysisCandidate(candidate)) {
    return {
      ...STANDARD_NON_PLANT_RESPONSE,
      references: []
    };
  }

  const uses = normalizeUsesText(candidate.uses ?? candidate.usage);
  if (!uses || uses === 'N/A') {
    throw new Error('AI response missing required field: uses');
  }
  const confidenceScore = requireConfidenceScore(candidate.confidenceScore ?? candidate.confidence_score);

  return {
    commonName: requireTextBlock(candidate.commonName ?? candidate.common_name, 'commonName'),
    scientificName: requireTextBlock(candidate.scientificName ?? candidate.scientific_name, 'scientificName'),
    origin: requireTextBlock(candidate.origin, 'origin'),
    uses,
    habitat: requireTextBlock(candidate.habitat, 'habitat'),
    confidenceScore,
    confidenceLabel: requireConfidenceLabel(candidate.confidenceLabel ?? candidate.confidence_label),
    keyCharacteristics: requireStringList(candidate.keyCharacteristics ?? candidate.key_characteristics, 'keyCharacteristics'),
    careTips: requireTextBlock(candidate.careTips ?? candidate.care_tips, 'careTips'),
    safetyNotes: requireTextBlock(candidate.safetyNotes ?? candidate.safety_notes, 'safetyNotes'),
    identificationNotes: requireTextBlock(candidate.identificationNotes ?? candidate.identification_notes, 'identificationNotes'),
    isGrownInCavite: toBoolean(candidate.isGrownInCavite ?? candidate.is_grown_in_cavite),
    tags: normalizeTags(candidate.tags),
    references
  };
}

export async function analyzeLeafImage(image: Buffer, mimeType: string): Promise<LeafAnalysisResponse> {
  if (!env.geminiApiKey || !env.geminiModel) {
    throw new Error('AI service is not configured. Missing GEMINI_API_KEY or GEMINI_MODEL.');
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  const prompt = [
    'Analyze this leaf image and provide the information in the following JSON format.',
    'IMPORTANT: Return ONLY the raw JSON object. Do NOT include markdown code blocks, backticks, or any explanation text.',
    'If the image is not a plant/leaf (for example, object, person, animal, document, or unclear scene), still return the same JSON schema using this exact fallback intent:',
    '- commonName: "Not a plant"',
    '- scientificName: "Not a plant"',
    '- origin: "N/A"',
    '- uses: "N/A"',
    '- habitat: "N/A"',
    '- confidenceScore: 0',
    '- confidenceLabel: "Low"',
    '- keyCharacteristics: ["Image does not appear to contain a plant leaf."]',
    '- careTips: "Retake the photo with a single clear leaf in frame and good lighting."',
    '- safetyNotes: "Do not consume unknown specimens without expert confirmation."',
    '- identificationNotes: "The uploaded image does not appear to be a plant/leaf photo."',
    '- tags: ["Not a Plant"]',
    'Required format:',
    '{',
    '  "scientificName": "scientific name here",',
    '  "commonName": "common name here",',
    '  "origin": "origin information here",',
    '  "uses": "uses and benefits here",',
    '  "habitat": "where it usually grows with specific location details",',
    '  "confidenceScore": 0-100 integer representing identification confidence,',
    '  "confidenceLabel": "High|Medium|Low",',
    '  "keyCharacteristics": ["short visual feature 1", "short visual feature 2"],',
    '  "careTips": "2-3 practical tips for growing or handling",',
    '  "safetyNotes": "important caution for consumption/handling",',
    '  "identificationNotes": "brief explanation of why this species was selected and what to verify manually",',
    '  "tags": ["Tag1", "Tag2", "Tag3"]',
    '}',
    'For "tags", generate 2-5 short category labels that describe this plant\'s primary uses.',
    'Examples: "Medicinal", "Culinary", "Anti-inflammatory", "Immune Booster", "Skin Care",',
    '"Aromatic", "Anti-diabetic", "Ornamental". Use your own judgment based on the plant.',
    'For "keyCharacteristics", provide 2-4 concise observations visible in the leaf image.',
    'Keep all text factual, concise, and avoid unsupported medical claims.',
    'Do not add any references/sources/citations field in the JSON.',
    'Return only valid JSON with these exact 12 fields, nothing else.'
  ].join('\n');

  const imageBase64 = image.toString('base64');

  const requestContents = [
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
  ];

  let payload;
  try {
    payload = await ai.models.generateContent({
      model: env.geminiModel,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        },
        tools: [{ googleSearch: {} }]
      },
      contents: requestContents
    });
  } catch (error) {
    if (!shouldRetryWithoutGrounding(error)) {
      throw error;
    }

    payload = await ai.models.generateContent({
      model: env.geminiModel,
      contents: requestContents
    });
  }

  const references = await extractGroundingReferences(payload);

  const textFromPayload = typeof payload.text === 'string' ? payload.text : '';
  const content = textFromPayload || extractTextContent((payload as { candidates?: unknown[] }).candidates ?? []);
  if (!content) {
    throw new Error('AI service returned empty content.');
  }

  const jsonText = extractJson(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch (error) {
    if (hasNonPlantTerm(content)) {
      return {
        ...STANDARD_NON_PLANT_RESPONSE,
        references: []
      };
    }

    const parseMessage = error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(`AI response JSON parsing failed: ${parseMessage}`);
  }

  return normalizeAnalysis(parsed, references);
}
