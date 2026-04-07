import type { LeafDoc } from '../db.js';
import type { AnalysisReference } from '../types.js';

export interface LeafDto {
  leafId: number;
  ownerUserId: number;
  commonName: string;
  scientificName: string;
  origin: string;
  usage: string;
  medicinalUses?: string;
  medicalConditions?: string[];
  habitat: string;
  confidenceScore?: number;
  confidenceLabel?: string;
  keyCharacteristics?: string[];
  careTips?: string;
  safetyNotes?: string;
  identificationNotes?: string;
  isGrownInCavite: boolean;
  imageFilename?: string;
  imageContentType?: string;
  imageSize?: number;
  isImagePublic: boolean;
  tags?: string[];
  references?: AnalysisReference[];
}

export function toLeafDto(leaf: LeafDoc): LeafDto {
  const ownerUserId =
    typeof (leaf as { ownerUserId?: unknown }).ownerUserId === 'number' && Number.isFinite((leaf as { ownerUserId?: number }).ownerUserId)
      ? (leaf as { ownerUserId: number }).ownerUserId
      : 0;

  return {
    leafId: leaf.leafId,
    ownerUserId,
    commonName: leaf.commonName,
    scientificName: leaf.scientificName,
    origin: leaf.origin,
    usage: leaf.usage,
    medicinalUses: leaf.medicinalUses,
    medicalConditions: leaf.medicalConditions ?? [],
    habitat: leaf.habitat,
    confidenceScore: leaf.confidenceScore,
    confidenceLabel: leaf.confidenceLabel,
    keyCharacteristics: leaf.keyCharacteristics,
    careTips: leaf.careTips,
    safetyNotes: leaf.safetyNotes,
    identificationNotes: leaf.identificationNotes,
    isGrownInCavite: Boolean(leaf.isGrownInCavite),
    imageFilename: leaf.imageFilename,
    imageContentType: leaf.imageContentType,
    imageSize: leaf.imageSize,
    isImagePublic: Boolean(leaf.isImagePublic),
    tags: leaf.tags,
    references: leaf.references ?? []
  };
}
