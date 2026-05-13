import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HandoffScreen } from '../components/HandoffScreen';
import { baseUrl, photo, pkg, session } from '../test/fixtures';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';

describe('HandoffScreen — photo-required guard', () => {
  it('disables the handoff button when no photo is registered', async () => {
    server.use(
      http.get(`${baseUrl}/delivery/packages/pkg-1`, () =>
        HttpResponse.json(pkg({ handoffPhoto: null })),
      ),
    );

    renderWithProviders(
      <HandoffScreen
        session={session}
        packageId="pkg-1"
        onBack={vi.fn()}
        onHandedOff={vi.fn()}
      />,
    );

    const button = await screen.findByRole('button', { name: /사진을 먼저 등록하세요/ });
    expect(button).toBeDisabled();
  });

  it('enables handoff after photo registration and calls onHandedOff with result', async () => {
    let handoffCalled = false;
    let currentPhoto = null as ReturnType<typeof photo> | null;

    server.use(
      http.get(`${baseUrl}/delivery/packages/pkg-1`, () =>
        HttpResponse.json(pkg({ handoffPhoto: currentPhoto })),
      ),
      http.post(`${baseUrl}/delivery/packages/pkg-1/handoff-photo`, async ({ request }) => {
        const body = (await request.json()) as { url: string };
        currentPhoto = photo({ url: body.url });
        return HttpResponse.json(currentPhoto);
      }),
      http.post(`${baseUrl}/delivery/packages/pkg-1/handoff`, () => {
        handoffCalled = true;
        return HttpResponse.json({
          packageId: 'pkg-1',
          orderId: 'order-1',
          items: [{ itemId: 'item-1', status: 'FINISHED', location: 'CUSTOMER' }],
          orderStatus: 'FINISHED',
        });
      }),
    );

    const onHandedOff = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <HandoffScreen
        session={session}
        packageId="pkg-1"
        onBack={vi.fn()}
        onHandedOff={onHandedOff}
      />,
    );

    expect(await screen.findByRole('button', { name: /사진을 먼저 등록하세요/ })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('사진 URL 또는 메모'), 'https://example.com/p.jpg');
    await user.click(screen.getByRole('button', { name: '등록' }));

    const completeButton = await screen.findByRole('button', { name: '인도 완료' });
    expect(completeButton).toBeEnabled();

    await user.click(completeButton);

    await waitFor(() => expect(handoffCalled).toBe(true));
    expect(onHandedOff).toHaveBeenCalledWith(
      expect.objectContaining({ packageId: 'pkg-1', orderStatus: 'FINISHED' }),
    );
  });
});
