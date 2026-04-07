import type { LeafDoc } from '../db.js';

export interface LeafDto {
  leafId: number;
  commonName: string;
  scientificName: string;
  origin: string;
  usage: string;
  habitat: string;
  isGrownInCavite: boolean;
  imageFilename?: string;
  imageContentType?: string;
  imageSize?: number;
  tags?: string[];
}

export function toLeafDto(leaf: LeafDoc): LeafDto {
  return {
    leafId: leaf.leafId,
    commonName: leaf.commonName,
    scientificName: leaf.scientificName,
    origin: leaf.origin,
    usage: leaf.usage,
    habitat: leaf.habitat,
    isGrownInCavite: Boolean(leaf.isGrownInCavite),
    imageFilename: leaf.imageFilename,
    imageContentType: leaf.imageContentType,
    imageSize: leaf.imageSize,
    tags: leaf.tags
  };
}
