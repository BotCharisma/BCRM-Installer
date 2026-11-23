import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Monitor,
  Moon,
  Search,
  Sparkles,
  Store,
  Sun,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AppIcon } from './AppIcon';
import { translateAppSummary } from '../lib/i18n';
import { invoke } from '../lib/tauri';
import { useApp } from '../lib/store';
import type {
  AccentPreset,
  DensityPreset,
  LanguageCode,
  MotionPreset,
  PackageDetails,
  RadiusPreset,
  RouteId,
  ThemeMode,
} from '../types';

export const PackageDrawer: React.FC = () => {
  const {
    t,
    language,
    drawerPackage,
    closePackageDrawer,
    enqueuePackages,
    installed,
    pushToast,
  } = useApp();

  const [details, setDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!drawerPackage) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    invoke<PackageDetails>('get_package_details', {
      id: drawerPackage.id,
      source: drawerPackage.source,
    })
      .then((res) => {
        if (!cancelled) setDetails(res);
      })
      .catch(() => {
        if (!cancelled) setDetails(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [drawerPackage]);

  if (!drawerPackage) return null;

  const installedMatch = installed.find(
    (r) => r.id.toLowerCase() === drawerPackage.id.toLowerCase(),
  );
  const isInstalled = Boolean(installedMatch) || drawerPackage.isInstalled;
  const hasUpdate = Boolean(installedMatch?.availableVersion) || drawerPackage.hasUpdate;
  const storeUrl =
    details?.storeUrl ??
    drawerPackage.storeUrl ??
    (drawerPackage.source === 'msstore'
      ? `ms-windows-store://pdp/?ProductId=${drawerPackage.id}`
      : null);

  const cliCommand = `winget install --id ${drawerPackage.id} --exact --source ${drawerPackage.source} --silent --accept-package-agreements --accept-source-agreements`;

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand);
      pushToast(t.toasts.copiedCmd, 'positive');
    } catch {
      pushToast(t.toasts.clipboardError, 'negative');
    }
  };

  const openStore = async () => {
    try {
      await invoke('open_ms_store', { productId: drawerPackage.id });
    } catch (err) {
      pushToast(String(err), 'negative');
    }
  };

  const openUrl = async (url: string) => {
    try {
      await invoke('open_external_url', { url });
    } catch (err) {
      pushToast(String(err), 'negative');
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePackageDrawer();
      }}
    >
      <div className="drawer-panel anim-drawer" role="dialog" aria-label={t.overlays.packageDetails}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <AppIcon id={drawerPackage.id} name={details?.name ?? drawerPackage.name} size={38} />
            <div style={{ minWidth: 0 }}>
              <h2 className="drawer-title">{details?.name ?? drawerPackage.name}</h2>
              <div className="pkg-id" translate="no">{drawerPackage.id}</div>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={closePackageDrawer}
            aria-label={t.overlays.closeDetails}
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge mono" translate="no">{drawerPackage.source}</span>
            <span className="badge tabular">
              {t.overlays.versionLabel}: {details?.version ?? drawerPackage.version}
            </span>
            {isInstalled && (
              <span className="badge badge-positive">
                <Check size={12} aria-hidden="true" /> {t.discover.installed} ({installedMatch?.version ?? 'Local'})
              </span>
            )}
            {hasUpdate && (
              <span className="badge badge-warning">
                {t.discover.newVersion(installedMatch?.availableVersion ?? drawerPackage.availableVersion ?? '')}
              </span>
            )}
          </div>

          <div className="subcard" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
              {t.overlays.descriptionLabel}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
              {loading
                ? t.overlays.loadingDetails
                : details?.description ??
                  translateAppSummary(drawerPackage.id, drawerPackage.summary, language) ??
                  t.overlays.noDescription}
            </div>
          </div>

          <div className="subcard" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                {t.overlays.publisherLabel}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                {details?.publisher ?? drawerPackage.publisher ?? '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                {t.overlays.licenseLabel}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                {details?.license ?? '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                {t.overlays.installerTypeLabel}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500 }} className="mono">
                {details?.installerType ?? (drawerPackage.source === 'msstore' ? 'msstore' : 'exe / msi')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                {t.overlays.homepageLabel}
              </div>
              {details?.homepage ? (
                <button
                  type="button"
                  onClick={() => openUrl(details.homepage!)}
                  style={{
                    fontSize: '0.78125rem',
                    color: 'var(--info)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{t.overlays.openWebsite}</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </button>
              ) : (
                <div style={{ fontSize: '0.8125rem' }}>—</div>
              )}
            </div>
          </div>

          <div className="code-block-wrap">
            <div className="code-block-head">
              <span>{t.overlays.cliEquivalent}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={copyCmd}
                style={{ height: 24, padding: '0 8px' }}
              >
                <Copy size={12} aria-hidden="true" />
                <span>{t.overlays.copy}</span>
              </button>
            </div>
            <pre className="code-block" translate="no">{cliCommand}</pre>
          </div>

          {storeUrl && (
            <button type="button" className="btn btn-secondary" onClick={openStore}>
              <Store size={15} aria-hidden="true" />
              <span>{t.overlays.openInMsStore}</span>
            </button>
          )}
        </div>

        <div className="drawer-foot">
          {isInstalled && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                enqueuePackages(
                  [
                    {
                      id: drawerPackage.id,
                      name: drawerPackage.name,
                      source: drawerPackage.source,
                      operation: 'uninstall',
                    },
                  ],
                  true,
                );
                closePackageDrawer();
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>{t.overlays.uninstall}</span>
            </button>
          )}
          {hasUpdate ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                enqueuePackages(
                  [
                    {
                      id: drawerPackage.id,
                      name: drawerPackage.name,
                      source: drawerPackage.source,
                      operation: 'upgrade',
                    },
                  ],
                  true,
                );
                closePackageDrawer();
              }}
            >
              <UploadCloud size={14} aria-hidden="true" />
              <span>{t.overlays.updateNow}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                enqueuePackages(
                  [
                    {
                      id: drawerPackage.id,
                      name: drawerPackage.name,
                      source: drawerPackage.source,
                      operation: 'install',
                    },
                  ],
                  true,
                );
                closePackageDrawer();
              }}
            >
              <Download size={14} aria-hidden="true" />
              <span>{isInstalled ? t.overlays.reinstall : t.overlays.downloadInstall}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CustomizerPopover: React.FC = () => {
  const { t, isCustomizerOpen, setCustomizerOpen, prefs, updatePrefs } = useApp();
  if (!isCustomizerOpen) return null;

  const languages: Array<{ id: LanguageCode; label: string }> = [
    { id: 'en', label: 'English' },
    { id: 'vi', label: 'Tiếng Việt' },
  ];

  const themes: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: 'dark', label: 'Dark', icon: <Moon size={13} aria-hidden="true" /> },
    { id: 'light', label: 'Light', icon: <Sun size={13} aria-hidden="true" /> },
    { id: 'system', label: 'System', icon: <Monitor size={13} aria-hidden="true" /> },
  ];

  const accents: Array<{ id: AccentPreset; label: string; color: string }> = [
    { id: 'monochrome', label: 'Mono', color: '#a1a1aa' },
    { id: 'emerald', label: 'Emerald', color: '#10b981' },
    { id: 'blue', label: 'Blue', color: '#3b82f6' },
    { id: 'violet', label: 'Violet', color: '#8b5cf6' },
  ];

  const radii: Array<{ id: RadiusPreset; label: string }> = [
    { id: 'sharp', label: t.overlays.radiusSharp },
    { id: 'default', label: t.overlays.radiusDefault },
    { id: 'rounded', label: t.overlays.radiusRounded },
  ];

  const densities: Array<{ id: DensityPreset; label: string }> = [
    { id: 'comfortable', label: t.overlays.densityComfortable },
    { id: 'compact', label: t.overlays.densityCompact },
  ];

  const motions: Array<{ id: MotionPreset; label: string }> = [
    { id: 'full', label: t.overlays.motionSmooth },
    { id: 'off', label: t.overlays.motionOff },
  ];

  return (
    <div className="customizer-popover anim-zoom" role="dialog" aria-label={t.overlays.customizerTitle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.overlays.customizerTitle}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCustomizerOpen(false)}
          aria-label={t.overlays.closeDetails}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          {t.overlays.language}
        </div>
        <div className="seg-options seg-cols-2">
          {languages.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`seg-option ${prefs.language === l.id ? 'active' : ''}`}
              onClick={() => updatePrefs({ language: l.id })}
            >
              <Globe size={12} aria-hidden="true" />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          {t.overlays.themeMode}
        </div>
        <div className="seg-options seg-cols-3">
          {themes.map((th) => (
            <button
              key={th.id}
              type="button"
              className={`seg-option ${prefs.theme === th.id ? 'active' : ''}`}
              onClick={() => updatePrefs({ theme: th.id })}
            >
              {th.icon}
              <span>{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          {t.overlays.accentColor}
        </div>
        <div className="seg-options seg-cols-2">
          {accents.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`seg-option ${prefs.accent === a.id ? 'active' : ''}`}
              onClick={() => updatePrefs({ accent: a.id })}
            >
              <span className="swatch-dot" style={{ background: a.color }} aria-hidden="true" />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          {t.overlays.borderRadius}
        </div>
        <div className="seg-options seg-cols-3">
          {radii.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`seg-option ${prefs.radius === r.id ? 'active' : ''}`}
              onClick={() => updatePrefs({ radius: r.id })}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            {t.overlays.density}
          </div>
          <div className="seg-options seg-cols-2">
            {densities.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`seg-option ${prefs.density === d.id ? 'active' : ''}`}
                onClick={() => updatePrefs({ density: d.id })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            {t.overlays.motion}
          </div>
          <div className="seg-options seg-cols-2">
            {motions.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`seg-option ${prefs.motion === m.id ? 'active' : ''}`}
                onClick={() => updatePrefs({ motion: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommandPalette: React.FC = () => {
  const {
    t,
    isCommandOpen,
    setCommandOpen,
    navigate,
    toggleThemeQuick,
    refreshInstalled,
    catalog,
    openPackageDrawer,
    installed,
    enqueuePackages,
  } = useApp();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isCommandOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isCommandOpen]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: Array<{
      id: string;
      group: string;
      label: string;
      hint: string;
      action: () => void;
    }> = [];

    const pages: RouteId[] = ['dashboard', 'discover', 'installed', 'queue', 'settings'];
    for (const id of pages) {
      const label = t.nav[id].title;
      if (!q || label.toLowerCase().includes(q) || t.nav[id].label.toLowerCase().includes(q)) {
        list.push({
          id: `nav-${id}`,
          group: t.overlays.cmdGroupNav,
          label,
          hint: t.nav[id].label,
          action: () => navigate(id),
        });
      }
    }

    const actions = [
      {
        id: 'act-theme',
        label: t.overlays.cmdToggleTheme,
        hint: 'Theme',
        action: toggleThemeQuick,
      },
      {
        id: 'act-scan',
        label: t.overlays.cmdRescan,
        hint: 'winget list',
        action: () => refreshInstalled(false),
      },
      {
        id: 'act-upgrade-all',
        label: t.overlays.cmdUpgradeAll,
        hint: 'Upgrade',
        action: () => {
          const updatable = installed.filter((r) => Boolean(r.availableVersion));
          if (updatable.length > 0) {
            enqueuePackages(
              updatable.map((r) => ({
                id: r.id,
                name: r.name,
                source: r.source,
                operation: 'upgrade',
              })),
              true,
            );
          }
        },
      },
    ];

    for (const act of actions) {
      if (!q || act.label.toLowerCase().includes(q)) {
        list.push({ ...act, group: t.overlays.cmdGroupActions });
      }
    }

    const matchedApps = catalog
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.source.toLowerCase().includes(q),
      )
      .slice(0, 6);

    for (const app of matchedApps) {
      list.push({
        id: `app-${app.id}`,
        group: t.overlays.cmdGroupCatalog,
        label: `${app.name} (${app.id})`,
        hint: app.source,
        action: () => {
          openPackageDrawer({
            id: app.id,
            name: app.name,
            version: app.installedVersion ?? 'Latest',
            availableVersion: app.availableVersion,
            source: app.source,
            isInstalled: app.isInstalled,
            hasUpdate: app.hasUpdate,
            category: app.category,
            summary: app.summary,
            publisher: app.publisher,
            tags: app.tags,
            storeUrl: app.storeUrl,
          });
        },
      });
    }

    return list;
  }, [query, catalog, installed, navigate, toggleThemeQuick, refreshInstalled, enqueuePackages, openPackageDrawer, t]);

  if (!isCommandOpen) return null;

  const runItem = (item: (typeof entries)[number] | undefined) => {
    if (!item) return;
    item.action();
    setCommandOpen(false);
  };

  return (
    <div
      className="cmd-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandOpen(false);
      }}
    >
      <div className="cmd-dialog anim-cmd" role="dialog" aria-label={t.topbar.quickSearch}>
        <div className="cmd-input-row">
          <Search size={16} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <input
            autoFocus
            type="search"
            name="command-search"
            autoComplete="off"
            spellCheck={false}
            aria-label={t.topbar.quickSearch}
            className="cmd-input"
            placeholder={t.overlays.cmdPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, Math.max(0, entries.length - 1)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runItem(entries[activeIndex]);
              }
            }}
          />
          <span className="kbd" aria-hidden="true">Esc</span>
        </div>

        <div className="cmd-results">
          {entries.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.overlays.cmdEmpty}
            </div>
          ) : (
            entries.map((entry, idx) => (
              <button
                key={entry.id}
                type="button"
                className={`cmd-item ${idx === activeIndex ? 'is-active' : ''}`}
                onClick={() => runItem(entry)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="cmd-item-left">
                  <Sparkles size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  <span>{entry.label}</span>
                </span>
                <span className="badge mono">{entry.hint}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const ToastRegion: React.FC = () => {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast anim-toast">
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                toast.tone === 'positive'
                  ? 'var(--positive)'
                  : toast.tone === 'negative'
                    ? 'var(--negative)'
                    : 'var(--info)',
              flexShrink: 0,
            }}
          />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
