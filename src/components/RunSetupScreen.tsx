import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { DeliveryRun, StaffSession } from '../types';
import { ErrorNotice } from './ErrorNotice';

export function RunSetupScreen({
  session,
  onRunReady,
}: {
  session: StaffSession;
  onRunReady: (run: DeliveryRun) => void;
}) {
  const vehiclesQuery = useQuery({
    queryKey: ['delivery', 'vehicles'],
    queryFn: () => api.getVehicles(session.accessToken),
  });

  const createRunMutation = useMutation({
    mutationFn: (code: string) => api.createRun(session.accessToken, code),
    onSuccess: onRunReady,
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">STEP 1</span>
        <h1>차량 선택</h1>
        <p>오늘 운행할 배달 차량을 선택해 런을 시작합니다.</p>
      </div>

      <div className="setup-steps">
        <div className="setup-step">
          <div className="step-title">
            <span className="step-number">1</span>
            <h2>배달 차량</h2>
          </div>

          {vehiclesQuery.isLoading ? (
            <div className="skeleton" />
          ) : vehiclesQuery.error ? (
            <ErrorNotice error={vehiclesQuery.error} />
          ) : (
            <div className="vehicle-grid">
              {(vehiclesQuery.data ?? []).map((v) => (
                <button
                  key={v.code}
                  className="vehicle-card"
                  disabled={createRunMutation.isPending}
                  type="button"
                  onClick={() => createRunMutation.mutate(v.code)}
                >
                  <span className="vehicle-icon">🚐</span>
                  <span className="vehicle-label">{v.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {createRunMutation.error ? <ErrorNotice error={createRunMutation.error} /> : null}

          <p style={{ color: 'var(--steel)', fontSize: 13, margin: 0 }}>
            차량을 선택하면 런이 시작됩니다. 스태프당 활성 런은 1개입니다.
          </p>
        </div>
      </div>
    </>
  );
}
