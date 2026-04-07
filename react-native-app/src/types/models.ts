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

export interface LeafReference {
  url: string;
  title: string;
}

export interface LeafAnalysisResponse {
  commonName: string;
  scientificName: string;
  origin: string;
  uses: string;
  habitat: string;
  isGrownInCavite: boolean;
  tags: string[];
  references: LeafReference[];
}

export interface AnalyzeAndSaveResponse {
  message: string;
  analysis: LeafAnalysisResponse;
  userId: number;
}

export interface LeafItem {
  leafId: number;
  commonName: string;
  scientificName: string;
  origin: string;
  usage: string;
  habitat: string;
  isGrownInCavite?: boolean;
  imageFilename?: string;
  imageContentType?: string;
  imageSize?: number;
  tags?: string[];
  references?: LeafReference[];
}

export interface LeafCollectionResponse {
  leafList: LeafItem[];
  createdAt: string;
  empty: boolean;
  leafCount: number;
}
