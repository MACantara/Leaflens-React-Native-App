export interface Session {
  token: string;
  userId: number;
  userName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  userName: string;
  email: string;
  message: string;
}

export interface LeafAnalysisResponse {
  commonName: string;
  scientificName: string;
  origin: string;
  uses: string;
  habitat: string;
  isGrownInCavite: boolean;
  tags: string[];
}

export interface AnalyzeAndSaveResponse {
  message: string;
  analysis: LeafAnalysisResponse;
  userId: number;
  leafId?: number;
  ownerUserId?: number;
  isImagePublic?: boolean;
}

export interface LeafItem {
  leafId: number;
  ownerUserId: number;
  commonName: string;
  scientificName: string;
  origin: string;
  usage: string;
  habitat: string;
  isGrownInCavite?: boolean;
  imageFilename?: string;
  imageContentType?: string;
  imageSize?: number;
  isImagePublic?: boolean;
  tags?: string[];
}

export interface LeafImageVisibilityResponse {
  leafId: number;
  isImagePublic: boolean;
}

export interface LeafCollectionResponse {
  leafList: LeafItem[];
  createdAt: string;
  empty: boolean;
  leafCount: number;
}
