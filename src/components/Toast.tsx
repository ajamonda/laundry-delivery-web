import { useEffect } from 'react';

export type ToastTone = 'success' | 'attention' | 'default';

export function Toast({
  message,
  tone = 'default',
  onDismiss,
  durationMs = 2500,
}: {
  message: string;
  tone?: ToastTone;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  const className =
    'toast' + (tone === 'success' ? ' toast-success' : tone === 'attention' ? ' toast-attention' : '');
  return <div className={className}>{message}</div>;
}
