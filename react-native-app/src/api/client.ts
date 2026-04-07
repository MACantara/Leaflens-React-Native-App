export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_PROD_API_BASE_URL = 'https://leaflens-backend.up.railway.app';
const fallbackBaseUrl = __DEV__ ? DEFAULT_DEV_API_BASE_URL : DEFAULT_PROD_API_BASE_URL;
const rawBaseUrl = (maybeProcess?.env?.EXPO_PUBLIC_API_BASE_URL ?? '').trim() || fallbackBaseUrl;
const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const REQUEST_TIMEOUT_MS = 12000;

type RequestOptions = RequestInit & {
  token?: string;
  isFormData?: boolean;
  requestTimeoutMs?: number;
};

function isJsonResponse(contentType: string | null): boolean {
  return Boolean(contentType && contentType.toLowerCase().includes('application/json'));
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (isJsonResponse(contentType)) {
    return response.json();
  }
  return response.text();
}

function extractApiErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const error = typeof record.error === 'string' ? record.error.trim() : '';
    const message = typeof record.message === 'string' ? record.message.trim() : '';

    if (error) {
      return error;
    }

    if (message) {
      return message;
    }
  }

  return `Request failed with status ${status}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, isFormData = false, requestTimeoutMs = REQUEST_TIMEOUT_MS, headers, ...rest } = options;

  const resolvedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined)
  };

  if (!isFormData && rest.body) {
    resolvedHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    resolvedHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = requestTimeoutMs > 0 ? setTimeout(() => controller.abort(), requestTimeoutMs) : undefined;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: resolvedHeaders,
      signal: controller.signal
    });
  } catch (fetchError) {
    const isLocalHostBaseUrl = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
    const networkHelp = isLocalHostBaseUrl
      ? `Cannot reach ${API_BASE_URL}. On a physical phone, localhost points to the phone. Set EXPO_PUBLIC_API_BASE_URL to your computer LAN IP (for example http://192.168.x.x:8080), restart Expo, and ensure backend is running.`
      : `Cannot reach ${API_BASE_URL}. Ensure backend is running and phone and computer are on the same Wi-Fi network.`;

    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      throw new ApiError(`${networkHelp} Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`, 0, {
        cause: fetchError.message
      });
    }

    throw new ApiError(networkHelp, 0, fetchError);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(extractApiErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}

export function buildQuery(params: Record<string, string | number | Array<string> | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== '') {
          searchParams.append(key, item);
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
