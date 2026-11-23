import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Copy,
  Loader2,
  RotateCcw,
  SkipForward,
  Store,
  TerminalSquare,
  Trash2,
  XCircle,
} from 'lucide-react';
import { invoke } from '../lib/tauri';
import { useApp } from '../lib/store';
import { AppIcon } from '../components/AppIcon';
import type { Translations } from '../lib/i18n';
import type { QueueItem } from '../types';

function statusBadge(item: QueueItem, t: Translations) {
  switch (item.status) {
    case 'running':
      return (
        <span className="badge badge-info">
          <Loader2 size={11} className="spin" aria-hidden="true" /> {t.queue.statusRunning}
        </span>
      );
    case 'completed':
      return (
        <span className="badge badge-positive">
          <CheckCircle2 size={11} aria-hidden="true" /> {t.queue.statusCompleted}
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-negative">
          <XCircle size={11} aria-hidden="true" /> {t.queue.statusFailed}
        </span>
      );
    case 'skipped':
      return <span className="badge badge-warning">{t.queue.statusSkipped}</span>;
    case 'cancelled':
      return <span className="badge">{t.queue.statusCancelled}</span>;
    default:
      return <span className="badge">{t.queue.statusPending}</span>;
  }
}

export const QueuePage: React.FC = () => {
  const {
    queue,
    isProcessingQueue,
    logs,
    clearLogs,
    skipQueueItem,
    cancelQueueItem,
    retryFailedQueue,
    clearCompletedQueue,
    pushToast,
    navigate,
    t,
  } = useApp();

  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const hasRetryable = queue.some(
    (q) => q.status === 'failed' || q.status === 'cancelled' || q.status === 'skipped',
  );
  const hasFinished = queue.some(
    (q) =>
      q.status === 'completed' ||
      q.status === 'failed' ||
      q.status === 'cancelled' ||
      q.status === 'skipped',
  );

  const copyLogs = async () => {
    try {
      const txt = logs.map((l) => `[${l.timestamp}] ${l.line}`).join('\n');
      await navigator.clipboard.writeText(txt);
      pushToast(t.toasts.copiedLogs, 'positive');
    } catch {
      pushToast(t.toasts.clipboardError, 'negative');
    }
  };

  return (
    <div className="anim-enter">
      <div className="toolbar">
        <div className="toolbar-left">
          <span className={`badge ${isProcessingQueue ? 'badge-info' : ''}`}>
            {isProcessingQueue ? t.queue.workerRunning : t.queue.workerIdle}
          </span>
          <span className="badge tabular">{t.queue.tasksCount(queue.length)}</span>
        </div>
        <div className="toolbar-right">
          {hasRetryable && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={retryFailedQueue}>
              <RotateCcw size={13} aria-hidden="true" />
              <span>{t.queue.retryFailed}</span>
            </button>
          )}
          {hasFinished && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearCompletedQueue}>
              <Trash2 size={13} aria-hidden="true" />
              <span>{t.queue.clearCompleted}</span>
            </button>
          )}
        </div>
      </div>

      <div className="queue-layout">
        {/* Left: Sequential Task List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card-head" style={{ marginBottom: 4 }}>
            <div>
              <h2 className="card-title">{t.queue.taskListTitle}</h2>
              <p className="card-sub">{t.queue.taskListSub}</p>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="subcard" style={{ textAlign: 'center', padding: '28px 16px' }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>{t.queue.emptyTitle}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                {t.queue.emptySub}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('discover')}
              >
                {t.queue.openDiscover}
              </button>
            </div>
          ) : (
            queue.map((item) => (
              <div key={item.uid} className="queue-item">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <AppIcon id={item.id} name={item.name} size={30} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <span className="badge mono">{item.operation}</span>
                      </div>
                      <div className="pkg-id">
                        {item.id} · {item.source}
                      </div>
                    </div>
                  </div>
                  {statusBadge(item, t)}
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${
                      item.status === 'running'
                        ? 'is-running'
                        : item.status === 'failed'
                          ? 'is-failed'
                          : ''
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>{item.message}</span>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    {item.source === 'msstore' && item.status === 'failed' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => invoke('open_ms_store', { productId: item.id })}
                      >
                        <Store size={12} aria-hidden="true" />
                        <span>{t.queue.openMsStore}</span>
                      </button>
                    )}
                    {(item.status === 'pending' || item.status === 'running') && (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => skipQueueItem(item.uid)}
                          title={t.queue.skip}
                        >
                          <SkipForward size={12} aria-hidden="true" />
                          <span>{t.queue.skip}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => cancelQueueItem(item.uid)}
                        >
                          {t.queue.cancel}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Live Terminal Console Stream */}
        <div className="terminal-console">
          <div className="terminal-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <TerminalSquare size={14} aria-hidden="true" />
              <span>{t.queue.terminalTitle}</span>
            </span>
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyLogs}>
                <Copy size={12} aria-hidden="true" />
                <span>{t.queue.copy}</span>
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearLogs}>
                <Trash2 size={12} aria-hidden="true" />
                <span>{t.queue.clear}</span>
              </button>
            </div>
          </div>

          <div className="terminal-body">
            {logs.length === 0 ? (
              <div className="terminal-line is-muted">{t.queue.terminalEmpty}</div>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className={`terminal-line ${
                    entry.level === 'error'
                      ? 'is-error'
                      : entry.level === 'success'
                        ? 'is-success'
                        : entry.level === 'muted'
                          ? 'is-muted'
                          : ''
                  }`}
                >
                  <span style={{ opacity: 0.55, marginRight: 8 }} className="tabular">
                    [{entry.timestamp}]
                  </span>
                  <span>{entry.line}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
