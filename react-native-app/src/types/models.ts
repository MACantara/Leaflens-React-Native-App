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

export interface AnalysisReference {
  title: string;
  uri: string;
  domain?: string;
}

export interface LeafAnalysisResponse {
  commonName: string;
  scientificName: string;
  origin: string;
  uses: string;
  habitat: string;
  confidenceScore: number;
  confidenceLabel: string;
  keyCharacteristics: string[];
  careTips: string;
  safetyNotes: string;
  identificationNotes: string;
  isGrownInCavite: boolean;
  tags: string[];
  references: AnalysisReference[];
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
  confidenceScore?: number;
  confidenceLabel?: string;
  keyCharacteristics?: string[];
  careTips?: string;
  safetyNotes?: string;
  identificationNotes?: string;
  isGrownInCavite?: boolean;
  imageFilename?: string;
  imageContentType?: string;
  imageSize?: number;
  isImagePublic?: boolean;
  tags?: string[];
  references?: AnalysisReference[];
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
