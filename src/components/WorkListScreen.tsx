import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { DeliveryPackage, DeliveryRun, StaffSession } from '../types';
import { ErrorNotice } from './ErrorNotice';
import { PackageCard } from './PackageCard';
import { RunCloseDialog } from './RunCloseDialog';

type Tab = 'ready' | 'delivering';

export function WorkListScreen({
  session,
  run,
  onSelectForOutbound,
  onSelectForHandoff,
  onRunClosed,
}: {
  session: StaffSession;
  run: DeliveryRun;
  onSelectForOutbound: (pkg: DeliveryPackage) => void;
  onSelectForHandoff: (pkg: DeliveryPackage) => void;
  onRunClosed: () => void;
}) {
  const [tab, setTab] = useState<Tab>('ready');
  const [confirmClose, setConfirmClose] = useState(false);

  const readyQuery = useQuery({
    queryKey: ['delivery', 'work'],
    queryFn: () => api.getWork(session.accessToken),
    refetchInterval: 5000,
  });

  const loadedQuery = useQuery({
    queryKey: ['delivery', 'loaded-packages'],
    queryFn: () => api.getLoadedPackages(session.accessToken),
    refetchInterval: 5000,
  });

  const ready = readyQuery.data ?? [];
  const delivering = loadedQuery.data ?? [];

  const activeQuery = tab === 'ready' ? readyQuery : loadedQuery;
  const visible = tab === 'ready' ? ready : delivering;

  return (
    <>
      <div className="page-header-row">
        <h1>오늘의 배달</h1>
        <button className="ghost-button" type="button" onClick={() => setConfirmClose(true)}>
          런 종료
        </button>
      </div>

      <div className="run-status-bar">
        <span>🚐 {run.vehicleDisplayName} 운행 중</span>
        <span style={{ color: 'var(--steel)' }}>{new Date(run.createdAt).toLocaleTimeString('ko-KR')}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={tab === 'ready' ? 'primary-button' : 'ghost-button'}
          onClick={() => setTab('ready')}
          style={{ flex: 1 }}
        >
          출고 대기 ({ready.length})
        </button>
        <button
          type="button"
          className={tab === 'delivering' ? 'primary-button' : 'ghost-button'}
          onClick={() => setTab('delivering')}
          style={{ flex: 1 }}
        >
          인도 대기 ({delivering.length})
        </button>
      </div>

      {activeQuery.isLoading ? (
        <div className="request-list">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : activeQuery.error ? (
        <ErrorNotice error={activeQuery.error} />
      ) : visible.length === 0 ? (
        <div className="handoff-empty">
          {tab === 'ready' ? '출고 대기 패키지가 없습니다.' : '트럭에 실린 패키지가 없습니다.'}
        </div>
      ) : (
        <div className="request-list">
          {visible.map((pkg) => (
            <PackageCard
              key={pkg.packageId}
              pkg={pkg}
              onClick={() => (tab === 'ready' ? onSelectForOutbound(pkg) : onSelectForHandoff(pkg))}
            />
          ))}
        </div>
      )}

      {confirmClose ? (
        <RunCloseDialog
          session={session}
          run={run}
          hasOpenWork={delivering.length > 0}
          onCancel={() => setConfirmClose(false)}
          onClosed={() => {
            setConfirmClose(false);
            onRunClosed();
          }}
        />
      ) : null}
    </>
  );
}
