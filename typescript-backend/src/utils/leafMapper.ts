import type { LeafDoc } from '../db.js';

export interface LeafDto {
  leafId: number;
  ownerUserId: number;
  commonName: string;
  scientificName: string;
  origin: string;
  usage: string;
  habitat: string;
  isGrownInCavite: boolean;
  imageFilename?: string;
  imageContentType?: string;
  imageSize?: number;
  isImagePublic: boolean;
  tags?: string[];
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
    habitat: leaf.habitat,
    isGrownInCavite: Boolean(leaf.isGrownInCavite),
    imageFilename: leaf.imageFilename,
    imageContentType: leaf.imageContentType,
    imageSize: leaf.imageSize,
    isImagePublic: Boolean(leaf.isImagePublic),
    tags: leaf.tags
  };
}
