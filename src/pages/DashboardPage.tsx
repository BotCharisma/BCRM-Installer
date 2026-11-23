import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  HardDrive,
  Package,
  RefreshCw,
  Store,
  Terminal,
  UploadCloud,
} from 'lucide-react';
import { AppIcon } from '../components/AppIcon';
import { translateCategory } from '../lib/i18n';
import { useApp } from '../lib/store';

export const DashboardPage: React.FC = () => {
  const {
    t,
    language,
    installed,
    catalog,
    queue,
    envInfo,
    navigate,
    enqueuePackages,
    openPackageDrawer,
    isLoadingInstalled,
  } = useApp();

  const stats = useMemo(() => {
    const totalInstalled = installed.length;
    const updatable = installed.filter((r) => Boolean(r.availableVersion));
    const wingetCount = installed.filter((r) => r.source === 'winget').length;
    const msstoreCount = installed.filter((r) => r.source === 'msstore').length;
    const otherCount = Math.max(0, totalInstalled - wingetCount - msstoreCount);
    const activeQueue = queue.filter((q) => q.status === 'pending' || q.status === 'running').length;
    const doneQueue = queue.filter((q) => q.status === 'completed').length;

    return {
      totalInstalled,
      updatable,
      wingetCount,
      msstoreCount,
      otherCount,
      activeQueue,
      doneQueue,
    };
  }, [installed, queue]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; installed: number }>();
    for (const c of catalog) {
      const prev = map.get(c.category) ?? { total: 0, installed: 0 };
      prev.total += 1;
      if (c.isInstalled) prev.installed += 1;
      map.set(c.category, prev);
    }
    return Array.from(map.entries()).map(([category, counts]) => ({ category, ...counts }));
  }, [catalog]);

  const popularStarters = useMemo(
    () => catalog.filter((c) => c.popular && !c.isInstalled).slice(0, 6),
    [catalog],
  );

  const totalBar = Math.max(1, stats.wingetCount + stats.msstoreCount + stats.otherCount);
  const wPct = Math.round((stats.wingetCount / totalBar) * 100);
  const mPct = Math.round((stats.msstoreCount / totalBar) * 100);
  const oPct = Math.max(0, 100 - wPct - mPct);

  const handleUpgradeAll = () => {
    if (stats.updatable.length === 0) return;
    enqueuePackages(
      stats.updatable.map((r) => ({
        id: r.id,
        name: r.name,
        source: r.source,
        operation: 'upgrade',
      })),
      true,
    );
  };

  const handleInstallStarters = () => {
    if (popularStarters.length === 0) return;
    enqueuePackages(
      popularStarters.map((c) => ({
        id: c.id,
        name: c.name,
        source: c.source,
        operation: 'install',
      })),
      true,
    );
  };

  return (
    <div className="dash-stack anim-enter">
      <section className="kpi-grid-4" aria-label={t.nav.dashboard.title}>
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">
              <Package size={14} strokeWidth={1.75} aria-hidden="true" />
              {t.dashboard.installedApps}
            </span>
            <span className="badge tabular">
              {isLoadingInstalled ? t.dashboard.scanning : t.dashboard.synced}
            </span>
          </div>
          <div className="kpi-bottom">
            <span className="kpi-value tabular">{stats.totalInstalled}</span>
            <span className="kpi-compare tabular">
              {stats.wingetCount} winget · {stats.msstoreCount} msstore
            </span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">
              <UploadCloud size={14} strokeWidth={1.75} aria-hidden="true" />
              {t.dashboard.updatesAvailable}
            </span>
            <span className={`badge ${stats.updatable.length > 0 ? 'badge-warning' : 'badge-positive'}`}>
              {stats.updatable.length > 0 ? t.dashboard.needsUpdate : t.dashboard.upToDate}
            </span>
          </div>
          <div className="kpi-bottom">
            <span className="kpi-value tabular">{stats.updatable.length}</span>
            {stats.updatable.length > 0 ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleUpgradeAll}>
                {t.dashboard.updateAll}
              </button>
            ) : (
              <span className="kpi-compare">{t.dashboard.allUpToDate}</span>
            )}
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">
              <Terminal size={14} strokeWidth={1.75} aria-hidden="true" />
              {t.dashboard.installQueue}
            </span>
            <span className={`badge ${stats.activeQueue > 0 ? 'badge-info' : ''}`}>
              {stats.activeQueue > 0 ? t.dashboard.processing : t.dashboard.idle}
            </span>
          </div>
          <div className="kpi-bottom">
            <span className="kpi-value tabular">{stats.activeQueue}</span>
            <span className="kpi-compare tabular">{t.dashboard.doneInSession(stats.doneQueue)}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">
              <HardDrive size={14} strokeWidth={1.75} aria-hidden="true" />
              {t.dashboard.storageMode}
            </span>
            <span className={`badge ${envInfo?.isPortable ? 'badge-info' : 'badge-positive'}`}>
              {envInfo?.isPortable ? 'Portable' : 'Installed'}
            </span>
          </div>
          <div className="kpi-bottom">
            <span className="kpi-value mono" style={{ fontSize: '1.25rem' }}>
              {envInfo?.wingetAvailable ? envInfo.wingetVersion : 'Offline'}
            </span>
            <span className="kpi-compare">{envInfo?.osVersion ?? 'Windows x64'}</span>
          </div>
        </div>
      </section>

      <section className="dash-split">
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">{t.dashboard.sourceDistribution}</h2>
              <p className="card-sub">{t.dashboard.sourceDistributionSub}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('discover')}
            >
              <span>{t.dashboard.openDiscover}</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          </div>

          <div className="segmented-bar" role="img" aria-label={t.dashboard.sourceDistribution}>
            <div
              className="segmented-slice"
              style={{ width: `${Math.max(8, wPct)}%`, background: 'var(--seg-1)' }}
              title={`winget: ${stats.wingetCount}`}
            />
            <div
              className="segmented-slice"
              style={{ width: `${Math.max(8, mPct)}%`, background: 'var(--positive)' }}
              title={`msstore: ${stats.msstoreCount}`}
            />
            <div
              className="segmented-slice"
              style={{ width: `${Math.max(6, oPct)}%`, background: 'var(--seg-3)' }}
              title={`Other/Local: ${stats.otherCount}`}
            />
          </div>

          <div className="leads-subgrid">
            <button
              type="button"
              className="lead-bucket-card"
              onClick={() => navigate('installed')}
            >
              <span className="lead-bucket-dash" style={{ background: 'var(--seg-1)' }} />
              <span className="lead-bucket-title">{t.dashboard.wingetSource}</span>
              <div className="lead-bucket-count tabular">
                {stats.wingetCount}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  {t.dashboard.packagesUnit} ({wPct}%)
                </span>
              </div>
            </button>

            <button
              type="button"
              className="lead-bucket-card"
              onClick={() => navigate('installed')}
            >
              <span className="lead-bucket-dash" style={{ background: 'var(--positive)' }} />
              <span className="lead-bucket-title">{t.dashboard.msstoreSource}</span>
              <div className="lead-bucket-count tabular">
                {stats.msstoreCount}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  {t.dashboard.packagesUnit} ({mPct}%)
                </span>
              </div>
            </button>

            <button
              type="button"
              className="lead-bucket-card"
              onClick={() => navigate('installed')}
            >
              <span className="lead-bucket-dash" style={{ background: 'var(--warning)' }} />
              <span className="lead-bucket-title">{t.dashboard.pendingUpdates}</span>
              <div className="lead-bucket-count tabular">
                {stats.updatable.length}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  {t.dashboard.newUnit}
                </span>
              </div>
            </button>

            <button
              type="button"
              className="lead-bucket-card"
              onClick={() => navigate('discover')}
            >
              <span className="lead-bucket-dash" style={{ background: 'var(--info)' }} />
              <span className="lead-bucket-title">{t.dashboard.curatedCatalog}</span>
              <div className="lead-bucket-count tabular">
                {catalog.length}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  {t.dashboard.essentialUnit}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">{t.dashboard.categoryCoverage}</h2>
              <p className="card-sub">{t.dashboard.categoryCoverageSub}</p>
            </div>
            <Store size={16} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {categoryBreakdown.map((item) => {
              const pct = item.total > 0 ? Math.round((item.installed / item.total) * 100) : 0;
              return (
                <div key={item.category} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78125rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {translateCategory(item.category, language)}
                    </span>
                    <span className="tabular" style={{ color: 'var(--text-muted)' }}>
                      {item.installed}/{item.total} ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill ksl-fill-grow"
                      style={{
                        width: `${Math.max(4, pct)}%`,
                        background: pct > 0 ? 'var(--accent)' : 'var(--border-strong)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dash-split">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 14 }}>
            <div>
              <h2 className="card-title">{t.dashboard.updatesReadyTitle}</h2>
              <p className="card-sub">{t.dashboard.updatesReadySub}</p>
            </div>
            {stats.updatable.length > 0 && (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleUpgradeAll}>
                <RefreshCw size={13} aria-hidden="true" />
                <span>{t.dashboard.updateAll} ({stats.updatable.length})</span>
              </button>
            )}
          </div>

          {stats.updatable.length === 0 ? (
            <div className="subcard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={18} style={{ color: 'var(--positive)', flexShrink: 0 }} aria-hidden="true" />
              <span>{t.dashboard.allLatestMsg}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.updatable.slice(0, 5).map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="subcard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <AppIcon id={item.id} name={item.name} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{item.name}</div>
                      <div className="pkg-id tabular">
                        {item.version} → <strong style={{ color: 'var(--positive)' }}>{item.availableVersion}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      enqueuePackages([
                        { id: item.id, name: item.name, source: item.source, operation: 'upgrade' },
                      ])
                    }
                  >
                    {t.dashboard.updateBtn}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head" style={{ marginBottom: 14 }}>
            <div>
              <h2 className="card-title">{t.dashboard.quickPicksTitle}</h2>
              <p className="card-sub">{t.dashboard.quickPicksSub}</p>
            </div>
            {popularStarters.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleInstallStarters}
              >
                <Download size={13} aria-hidden="true" />
                <span>{t.dashboard.installAllN(popularStarters.length)}</span>
              </button>
            )}
          </div>

          {popularStarters.length === 0 ? (
            <div className="subcard">{t.dashboard.allStartersInstalled}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {popularStarters.map((app) => (
                <div
                  key={app.id}
                  className="subcard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    style={{ textAlign: 'left', minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}
                    onClick={() =>
                      openPackageDrawer({
                        id: app.id,
                        name: app.name,
                        version: 'Latest',
                        source: app.source,
                        isInstalled: app.isInstalled,
                        hasUpdate: app.hasUpdate,
                        category: app.category,
                        summary: app.summary,
                        publisher: app.publisher,
                        tags: app.tags,
                        storeUrl: app.storeUrl,
                      })
                    }
                  >
                    <AppIcon id={app.id} name={app.name} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{app.name}</div>
                      <div className="pkg-id" translate="no">
                        {app.id} · {app.source}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      enqueuePackages([
                        { id: app.id, name: app.name, source: app.source, operation: 'install' },
                      ])
                    }
                  >
                    <Download size={13} aria-hidden="true" />
                    <span>{t.dashboard.installBtn}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
