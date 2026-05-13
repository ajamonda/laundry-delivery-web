import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, ApiError } from '../api';
import { baseUrl } from '../test/fixtures';
import { server } from '../test/server';

describe('api error contract', () => {
  it('throws ApiError carrying status, server message, and details payload', async () => {
    server.use(
      http.post(`${baseUrl}/delivery/runs`, () =>
        HttpResponse.json(
          { message: '활성 런이 이미 있습니다.', code: 'RUN_ALREADY_ACTIVE' },
          { status: 409 },
        ),
      ),
    );

    await expect(api.createRun('tok', 'truck-a')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: '활성 런이 이미 있습니다.',
      details: { message: '활성 런이 이미 있습니다.', code: 'RUN_ALREADY_ACTIVE' },
    });
  });

  it('falls back to generic message when server returns no body', async () => {
    server.use(
      http.get(`${baseUrl}/delivery/work`, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(api.getWork('tok')).rejects.toBeInstanceOf(ApiError);
    await expect(api.getWork('tok')).rejects.toMatchObject({ status: 500 });
  });

  it('sends Authorization header and selects POST when body is present', async () => {
    let captured: { method: string; auth: string | null } | null = null;
    server.use(
      http.post(`${baseUrl}/delivery/packages/pkg-1/scan-outbound`, ({ request }) => {
        captured = { method: request.method, auth: request.headers.get('Authorization') };
        return HttpResponse.json({ packageId: 'pkg-1', orderId: 'o', items: [] });
      }),
    );

    await api.scanOutbound('my-token', 'pkg-1');

    expect(captured).toEqual({ method: 'POST', auth: 'Bearer my-token' });
  });

  it('uses GET when no body is provided', async () => {
    let method: string | null = null;
    server.use(
      http.get(`${baseUrl}/delivery/runs/me/active`, ({ request }) => {
        method = request.method;
        return HttpResponse.json(null);
      }),
    );

    await api.getActiveRun('tok');

    expect(method).toBe('GET');
  });
});
