import { apiRequest, buildQuery, getApiBaseUrl } from './client';
import {
  AnalyzeAndSaveResponse,
  LeafAnalysisResponse,
  LeafCollectionResponse,
  LeafItem
} from '../types/models';

function buildImageFormData(fieldName: string, imageUri: string): FormData {
  const formData = new FormData();
  formData.append(fieldName, {
    uri: imageUri,
    name: 'leaf-image.jpg',
    type: 'image/jpeg'
  } as never);
  return formData;
}

export function analyzeLeaf(imageUri: string): Promise<LeafAnalysisResponse> {
  const body = buildImageFormData('image', imageUri);
  return apiRequest<LeafAnalysisResponse>('/api/v1/leaf-analyzer/analyze', {
    method: 'POST',
    body,
    isFormData: true
  });
}

export function analyzeAndSaveLeaf(imageUri: string, userId: number, token: string): Promise<AnalyzeAndSaveResponse> {
  const body = buildImageFormData('leaf-image', imageUri);
  return apiRequest<AnalyzeAndSaveResponse>(`/api/v1/leaf-analyzer/analyze-save/${userId}`, {
    method: 'POST',
    token,
    body,
    isFormData: true
  });
}

export function exploreLeaves(token: string, keyword?: string, tags: string[] = []): Promise<LeafItem[]> {
  const query = buildQuery({ keyword, tag: tags });
  return apiRequest<LeafItem[]>(`/api/v1/leaves/explore${query}`, { method: 'GET', token });
}

export function saveExploreLeaf(leafId: number, userId: number, token: string): Promise<string> {
  return apiRequest<string>(`/api/v1/leaves/explore/${leafId}/save/${userId}`, {
    method: 'POST',
    token
  });
}

export function getUserHistory(userId: number, token: string): Promise<LeafCollectionResponse> {
  return apiRequest<LeafCollectionResponse>(`/api/v1/leaf-history/user/${userId}`, {
    method: 'GET',
    token
  });
}

export function getUserLeafCount(userId: number, token: string): Promise<number> {
  return apiRequest<number>(`/api/v1/leaf-history/user/${userId}/count`, {
    method: 'GET',
    token
  });
}

export function searchUserLeaves(userId: number, token: string, keyword?: string, tags: string[] = []): Promise<LeafItem[]> {
  const query = buildQuery({ keyword, tag: tags });
  return apiRequest<LeafItem[]>(`/api/v1/leaf-history/user/${userId}/search${query}`, {
    method: 'GET',
    token
  });
}

export function getUserTags(userId: number, token: string): Promise<string[]> {
  return apiRequest<string[]>(`/api/v1/tags/user/${userId}`, {
    method: 'GET',
    token
  });
}

export function deleteLeaf(leafId: number, token: string): Promise<string> {
  return apiRequest<string>(`/api/v1/leaf-history/leaf/${leafId}`, {
    method: 'DELETE',
    token
  });
}

export function getLeafImageUrl(leafId: number): string {
  return `${getApiBaseUrl()}/api/v1/leaf-history/leaf/${leafId}/image`;
}

export function getLeafImageSource(leafId: number, token: string): { uri: string; headers: { Authorization: string } } {
  return {
    uri: getLeafImageUrl(leafId),
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}
