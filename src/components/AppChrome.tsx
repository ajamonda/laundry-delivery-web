import type { ReactNode } from 'react';
import type { AppStep, DeliveryRun, StaffSession } from '../types';

const stepLabels: Array<{ step: AppStep; label: string }> = [
  { step: 'run-setup', label: '런 준비' },
  { step: 'work-list', label: '배달 목록' },
  { step: 'work-detail', label: '출고' },
  { step: 'handoff', label: '인도' },
];

function activeGroup(step: AppStep): AppStep {
  return step;
}

export function AppChrome({
  children,
  onLogout,
  session,
  step,
  run,
}: {
  children: ReactNode;
  onLogout: () => void;
  session: StaffSession | null;
  step: AppStep;
  run: DeliveryRun | null;
}) {
  const showNav = step !== 'login';

  return (
    <div className="app-shell">
      <div className="promo-banner">
        <span>세탁 서비스</span>
        <strong>DELIVERY</strong>
      </div>

      <nav className="top-nav" aria-label="주요 메뉴">
        <div className="brand-mark">
          <span className="brand-dot" />
          배달 운영
        </div>

        {showNav ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {stepLabels.map((item) => (
              <span
                key={item.step}
                style={{
                  background: activeGroup(step) === item.step ? 'var(--ink-deep)' : 'transparent',
                  border: '1px solid var(--hairline)',
                  borderRadius: 100,
                  color: activeGroup(step) === item.step ? 'var(--canvas)' : 'var(--ink)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="nav-right">
          {session ? (
            <>
              {run ? <span className="staff-pill">🚐 {run.vehicleDisplayName}</span> : null}
              <span className="staff-pill">{session.staff.staffId}</span>
              <button className="logout-button" type="button" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </nav>

      <div className="page-content">{children}</div>
    </div>
  );
}
