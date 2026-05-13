import type {
  DeliveryPackage,
  DeliveryRun,
  DeliveryVehicle,
  HandoffPhoto,
  HandoffResult,
  ScanOutboundResult,
  StaffSession,
} from './types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  token?: string;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const api = {
  staffDevLogin(staffId: string) {
    return request<StaffSession>('/auth/staff/delivery/dev-login', {
      body: { staffId },
    });
  },

  getVehicles(token: string) {
    return request<DeliveryVehicle[]>('/delivery/vehicles', { token });
  },

  getActiveRun(token: string) {
    return request<DeliveryRun | null>('/delivery/runs/me/active', { token });
  },

  createRun(token: string, vehicleCode: string) {
    return request<DeliveryRun>('/delivery/runs', {
      token,
      body: { vehicleCode },
    });
  },

  closeRun(token: string, runId: string) {
    return request<DeliveryRun>(`/delivery/runs/${runId}/close`, {
      token,
      body: {},
    });
  },

  getWork(token: string) {
    return request<DeliveryPackage[]>('/delivery/work', { token });
  },

  getLoadedPackages(token: string) {
    return request<DeliveryPackage[]>('/delivery/runs/me/loaded-packages', { token });
  },

  getPackage(token: string, packageId: string) {
    return request<DeliveryPackage>(`/delivery/packages/${packageId}`, { token });
  },

  scanOutbound(token: string, packageId: string) {
    return request<ScanOutboundResult>(`/delivery/packages/${packageId}/scan-outbound`, {
      token,
      body: {},
    });
  },

  handoff(token: string, packageId: string) {
    return request<HandoffResult>(`/delivery/packages/${packageId}/handoff`, {
      token,
      body: {},
    });
  },

  recordHandoffPhoto(token: string, packageId: string, url: string) {
    return request<HandoffPhoto>(`/delivery/packages/${packageId}/handoff-photo`, {
      token,
      body: { url },
    });
  },
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const payload = text ? parseJson(text) : null;

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `요청에 실패했어요. (${response.status})`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
