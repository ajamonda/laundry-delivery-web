import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import { useAppStore } from './store';
import type { AppStep, DeliveryRun, HandoffResult, ScanOutboundResult, StaffSession } from './types';
import { orderStatusLabel } from './utils';
import { AppChrome } from './components/AppChrome';
import { LoginScreen } from './components/LoginScreen';
import { RunSetupScreen } from './components/RunSetupScreen';
import { WorkListScreen } from './components/WorkListScreen';
import { WorkDetailScreen } from './components/WorkDetailScreen';
import { HandoffScreen } from './components/HandoffScreen';
import { Toast, ToastTone } from './components/Toast';

type Notice = { message: string; tone: ToastTone };

export function App() {
  const { session, run, setSession, setRun, clearWorkState } = useAppStore();
  const qc = useQueryClient();

  const [step, setStep] = useState<AppStep>(() => {
    if (!session) return 'login';
    if (!run) return 'run-setup';
    return 'work-list';
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // 세션 복원 시 서버의 활성 run 상태를 동기화
  const activeRunQuery = useQuery({
    queryKey: ['delivery', 'active-run'],
    queryFn: () => api.getActiveRun(session!.accessToken),
    enabled: !!session,
    staleTime: 0,
  });

  useEffect(() => {
    if (!session) return;
    if (activeRunQuery.data === undefined) return;

    const serverRun = activeRunQuery.data;
    if (serverRun) {
      if (!run || run.id !== serverRun.id) {
        setRun(serverRun);
      }
      setStep((prev) => (prev === 'login' || prev === 'run-setup' ? 'work-list' : prev));
    } else {
      if (run) setRun(null);
      setStep('run-setup');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRunQuery.data, session]);

  useEffect(() => {
    if (activeRunQuery.error instanceof ApiError && activeRunQuery.error.status === 401) {
      handleLogout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRunQuery.error]);

  function handleLoggedIn(s: StaffSession) {
    setSession(s);
    setStep('run-setup');
    qc.invalidateQueries({ queryKey: ['delivery'] });
  }

  function handleLogout() {
    setSession(null);
    clearWorkState();
    setSelectedPackageId(null);
    setStep('login');
    qc.clear();
  }

  function handleRunReady(newRun: DeliveryRun) {
    setRun(newRun);
    qc.invalidateQueries({ queryKey: ['delivery', 'active-run'] });
    setStep('work-list');
  }

  function handleSelectForOutbound(pkg: { packageId: string }) {
    setSelectedPackageId(pkg.packageId);
    setStep('work-detail');
  }

  function handleSelectForHandoff(pkg: { packageId: string }) {
    setSelectedPackageId(pkg.packageId);
    setStep('handoff');
  }

  function handleScanned(result: ScanOutboundResult) {
    setNotice({ message: `출고 완료 (${result.items.length}개)`, tone: 'success' });
    setSelectedPackageId(null);
    setStep('work-list');
  }

  function handleHandedOff(result: HandoffResult) {
    setNotice({
      message: `인도 완료 · ${orderStatusLabel(result.orderStatus)}`,
      tone: result.orderStatus === 'FINISHED' ? 'success' : 'attention',
    });
    setSelectedPackageId(null);
    setStep('work-list');
  }

  function handleRunClosed() {
    clearWorkState();
    setSelectedPackageId(null);
    setStep('run-setup');
    qc.invalidateQueries({ queryKey: ['delivery'] });
    setNotice({ message: '배달 런이 종료되었습니다.', tone: 'default' });
  }

  return (
    <AppChrome onLogout={handleLogout} session={session} step={step} run={run}>
      {step === 'login' ? <LoginScreen onLoggedIn={handleLoggedIn} /> : null}

      {step === 'run-setup' && session ? (
        <RunSetupScreen session={session} onRunReady={handleRunReady} />
      ) : null}

      {step === 'work-list' && session && run ? (
        <WorkListScreen
          session={session}
          run={run}
          onSelectForOutbound={handleSelectForOutbound}
          onSelectForHandoff={handleSelectForHandoff}
          onRunClosed={handleRunClosed}
        />
      ) : null}

      {step === 'work-detail' && session && selectedPackageId ? (
        <WorkDetailScreen
          session={session}
          packageId={selectedPackageId}
          onBack={() => {
            setSelectedPackageId(null);
            setStep('work-list');
          }}
          onScanned={handleScanned}
        />
      ) : null}

      {step === 'handoff' && session && selectedPackageId ? (
        <HandoffScreen
          session={session}
          packageId={selectedPackageId}
          onBack={() => {
            setSelectedPackageId(null);
            setStep('work-list');
          }}
          onHandedOff={handleHandedOff}
        />
      ) : null}

      {notice ? (
        <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />
      ) : null}
    </AppChrome>
  );
}
