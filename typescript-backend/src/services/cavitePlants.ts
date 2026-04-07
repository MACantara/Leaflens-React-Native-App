import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CavitePlantRecord {
  commonName: string;
  scientificName: string;
}

interface CavitePlantDataset {
  plants: CavitePlantRecord[];
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const datasetPath = path.resolve(currentDir, '../../src/data/cavite-plants.json');

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadDataset(): CavitePlantDataset {
  const raw = fs.readFileSync(datasetPath, 'utf8');
  return JSON.parse(raw) as CavitePlantDataset;
}

const cavitePlants = loadDataset().plants;
const caviteCommonNames = new Set(cavitePlants.map((plant) => normalizeName(plant.commonName)).filter(Boolean));
const caviteScientificNames = new Set(cavitePlants.map((plant) => normalizeName(plant.scientificName)).filter(Boolean));

function hasFuzzyMatch(value: string, candidates: Set<string>): boolean {
  if (!value) {
    return false;
  }

  if (candidates.has(value)) {
    return true;
  }

  for (const candidate of candidates) {
    if (candidate.length < 4 || value.length < 4) {
      continue;
    }

    if (value.includes(candidate) || candidate.includes(value)) {
      return true;
    }
  }

  return false;
}

export function isKnownCavitePlant(params: {
  commonName?: string;
  scientificName?: string;
}): boolean {
  const commonName = normalizeName(params.commonName ?? '');
  const scientificName = normalizeName(params.scientificName ?? '');

  return hasFuzzyMatch(commonName, caviteCommonNames) || hasFuzzyMatch(scientificName, caviteScientificNames);
}

export function resolveCaviteGrowthFlag(params: {
  commonName?: string;
  scientificName?: string;
  modelValue?: boolean;
}): boolean {
  if (isKnownCavitePlant(params)) {
    return true;
  }

  return Boolean(params.modelValue);
}
