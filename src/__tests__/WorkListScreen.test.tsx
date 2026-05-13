import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkListScreen } from '../components/WorkListScreen';
import { baseUrl, pkg, run, session } from '../test/fixtures';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';

describe('WorkListScreen — tab routes to correct handler', () => {
  it('ready tab → onSelectForOutbound; delivering tab → onSelectForHandoff', async () => {
    const readyPkg = pkg({
      packageId: 'pkg-ready',
      address: '강남구 출고대기',
      items: [{ itemId: 'i1', tagBarcode: null, catalogItemCode: 'c', displayNameSnapshot: '셔츠', status: 'READY_FOR_DELIVERY' }],
    });
    const deliveringPkg = pkg({
      packageId: 'pkg-delivering',
      address: '서초구 인도대기',
      items: [{ itemId: 'i2', tagBarcode: null, catalogItemCode: 'c', displayNameSnapshot: '바지', status: 'DELIVERING' }],
    });

    server.use(
      http.get(`${baseUrl}/delivery/work`, () => HttpResponse.json([readyPkg])),
      http.get(`${baseUrl}/delivery/runs/me/loaded-packages`, () => HttpResponse.json([deliveringPkg])),
    );

    const onOutbound = vi.fn();
    const onHandoff = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <WorkListScreen
        session={session}
        run={run}
        onSelectForOutbound={onOutbound}
        onSelectForHandoff={onHandoff}
        onRunClosed={vi.fn()}
      />,
    );

    const readyCard = await screen.findByText('강남구 출고대기');
    await user.click(readyCard);
    expect(onOutbound).toHaveBeenCalledWith(expect.objectContaining({ packageId: 'pkg-ready' }));
    expect(onHandoff).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /인도 대기/ }));
    const deliveringCard = await screen.findByText('서초구 인도대기');
    await user.click(deliveringCard);
    expect(onHandoff).toHaveBeenCalledWith(expect.objectContaining({ packageId: 'pkg-delivering' }));
  });
});
