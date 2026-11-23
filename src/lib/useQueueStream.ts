import { Channel } from '@tauri-apps/api/core';
import { useEffect } from 'react';
import { invoke, isTauriRuntime } from './tauri';
import type { QueueStreamEvent } from '../types';

export function useQueueStream(onEvent: (event: QueueStreamEvent) => void): void {
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    const streamId = crypto.randomUUID();
    let cancelled = false;
    const channel = new Channel<QueueStreamEvent>();
    channel.onmessage = (msg) => {
      if (!cancelled) {
        onEvent(msg);
      }
    };

    invoke('start_queue_stream', { streamId, onEvent: channel }).catch(() => {});

    const cancelStream = () => {
      if (cancelled) return;
      cancelled = true;
      invoke('cancel_queue_stream', { streamId }).catch(() => {});
    };

    const onPageHide = () => cancelStream();
    window.addEventListener('pagehide', onPageHide);

    if (import.meta.hot) {
      import.meta.hot.dispose(() => cancelStream());
    }

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      cancelStream();
    };
  }, [onEvent]);
}
