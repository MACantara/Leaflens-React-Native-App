import type { LeafAnalysisResponse } from '../types.js';

const PLACEHOLDER_TERMS = [
  '',
  'n/a',
  'na',
  'none',
  'unknown',
  'unknown leaf',
  'unknown species',
  'not applicable',
  'cannot identify plant from image',
  'error',
  'error processing image'
];

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!,;:]+$/g, '');
}

function isPlaceholderText(value: unknown): boolean {
  const normalized = normalizeText(value);

  if (PLACEHOLDER_TERMS.includes(normalized)) {
    return true;
  }

  return normalized.startsWith('error:') || normalized.startsWith('cannot identify');
}

function hasMeaningfulText(value: unknown): boolean {
  const normalized = normalizeText(value);
  if (!normalized) {
    return false;
  }

  return !isPlaceholderText(normalized);
}

export function isApplicableAnalysis(result: LeafAnalysisResponse): boolean {
  // A record is considered applicable when at least one core name field is meaningful.
  return hasMeaningfulText(result.commonName) || hasMeaningfulText(result.scientificName);
}

export function isApplicableLeafRecord(params: {
  commonName?: string;
  scientificName?: string;
}): boolean {
  return hasMeaningfulText(params.commonName) || hasMeaningfulText(params.scientificName);
}
