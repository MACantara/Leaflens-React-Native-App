export interface JwtClaims {
  userId: number;
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
  medicinalUses: string;
  medicalConditions: string[];
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

export interface LeafRow {
  leaf_id: number;
  common_name: string;
  scientific_name: string | null;
  origin: string | null;
  usage: string | null;
  habitat: string | null;
  image_filename: string | null;
  image_content_type: string | null;
  image_size: number | null;
  image_data?: Buffer | null;
}
