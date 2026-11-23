import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  HardDrive,
  LayoutDashboard,
  Menu,
  Minus,
  Moon,
  PackageCheck,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  Square,
  Store,
  Sun,
  TerminalSquare,
  X,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriRuntime } from '../lib/tauri';
import { useApp } from '../lib/store';
import type { RouteId } from '../types';

const NAV_ICONS: Record<RouteId, LucideIcon> = {
  dashboard: LayoutDashboard,
  discover: Store,
  installed: PackageCheck,
  queue: TerminalSquare,
  settings: Settings,
};

const ROUTE_ORDER: RouteId[] = ['dashboard', 'discover', 'installed', 'queue', 'settings'];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    route,
    navigate,
    t,
    prefs,
    updatePrefs,
    toggleThemeQuick,
    envInfo,
    installed,
    isLoadingInstalled,
    refreshInstalled,
    cart,
    clearCart,
    enqueuePackages,
    queue,
    isProcessingQueue,
    setCommandOpen,
    isCustomizerOpen,
    setCustomizerOpen,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Partial<Record<RouteId, HTMLButtonElement | null>>>({});

  const updatesCount = useMemo(
    () => installed.filter((r) => Boolean(r.availableVersion)).length,
    [installed],
  );
  const activeQueueCount = useMemo(
    () => queue.filter((q) => q.status === 'pending' || q.status === 'running').length,
    [queue],
  );
  const cartItems = useMemo(() => Object.values(cart), [cart]);

  const currentMeta = t.nav[route];

  const isDarkNow =
    prefs.theme === 'dark' ||
    (prefs.theme === 'system' &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-color-scheme: light)').matches);

  // Sync window maximize state with Tauri window
  useEffect(() => {
    if (!isTauriRuntime()) return;
    const win = getCurrentWindow();
    let active = true;
    const checkMax = async () => {
      try {
        const m = await win.isMaximized();
        if (active) setIsMaximized(m);
      } catch {
        // Ignore
      }
    };
    void checkMax();
    window.addEventListener('resize', checkMax);
    return () => {
      active = false;
      window.removeEventListener('resize', checkMax);
    };
  }, []);

  const handleMinimize = () => {
    if (!isTauriRuntime()) return;
    void getCurrentWindow().minimize();
  };

  const handleToggleMaximize = async () => {
    if (!isTauriRuntime()) return;
    const win = getCurrentWindow();
    await win.toggleMaximize();
    setIsMaximized(await win.isMaximized());
  };

  const handleClose = () => {
    if (!isTauriRuntime()) return;
    void getCurrentWindow().close();
  };

  const syncPill = useCallback(() => {
    const btn = btnRefs.current[route];
    const pill = pillRef.current;
    const container = scrollRef.current;
    if (!btn || !pill || !container) return;

    pill.style.opacity = '1';
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.height = `${btn.offsetHeight}px`;
    pill.style.transform = `translate3d(${btn.offsetLeft}px, ${btn.offsetTop}px, 0)`;
  }, [route]);

  useLayoutEffect(() => {
    syncPill();
  }, [syncPill, prefs.sidebarCollapsed, prefs.language, updatesCount, activeQueueCount]);

  useEffect(() => {
    window.addEventListener('resize', syncPill);
    return () => window.removeEventListener('resize', syncPill);
  }, [syncPill]);

  const handleBatchInstallFromTopbar = async () => {
    if (cartItems.length === 0) return;
    await enqueuePackages(
      cartItems.map((c) => ({
        id: c.id,
        name: c.name,
        source: c.source,
        operation: 'install',
      })),
      true,
    );
    clearCart();
  };

  return (
    <div className="desktop-window">
      {/* Custom Theme-Aware Window Titlebar */}
      <div
        className="window-titlebar"
        data-tauri-drag-region
        onDoubleClick={() => {
          void handleToggleMaximize();
        }}
      >
        <div className="window-titlebar-left" data-tauri-drag-region>
          <img
            src="/app-icon.png"
            alt=""
            width={16}
            height={16}
            className="window-titlebar-icon"
            data-tauri-drag-region
          />
          <span className="window-titlebar-title" translate="no" data-tauri-drag-region>
            BCRM WinStore
          </span>
        </div>

        <div className="window-titlebar-controls">
          <button
            type="button"
            className="titlebar-btn"
            onClick={handleMinimize}
            aria-label="Minimize window"
            title="Minimize"
          >
            <Minus size={13} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="titlebar-btn"
            onClick={() => {
              void handleToggleMaximize();
            }}
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Copy size={11} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Square size={11} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="titlebar-btn titlebar-btn-close"
            onClick={handleClose}
            aria-label="Close window"
            title="Close"
          >
            <X size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={[
          'app-shell',
          prefs.sidebarCollapsed ? 'sidebar-collapsed' : '',
          mobileOpen ? 'mobile-nav-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <aside className="sidebar" aria-label={t.navSection}>
          <div className="sidebar-top">
            <button
              type="button"
              className="brand-btn"
              onClick={() => {
                navigate('dashboard');
                setMobileOpen(false);
              }}
            >
              <span className="brand-mark-img" aria-hidden="true">
                <img src="/app-icon.png" alt="" width={24} height={24} />
              </span>
              <span className="brand-name" translate="no">
                BCRM WinStore
              </span>
            </button>

            <button
              type="button"
              className="icon-btn desktop-collapse-btn"
              title={prefs.sidebarCollapsed ? t.topbar.expandSidebar : t.topbar.collapseSidebar}
              aria-label={
                prefs.sidebarCollapsed ? t.topbar.expandSidebar : t.topbar.collapseSidebar
              }
              onClick={() => updatePrefs({ sidebarCollapsed: !prefs.sidebarCollapsed })}
            >
              {prefs.sidebarCollapsed ? (
                <PanelLeftOpen size={16} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={16} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="button"
            className="search-trigger"
            onClick={() => setCommandOpen(true)}
            aria-label={t.topbar.quickSearch}
          >
            <span className="search-trigger-left">
              <Search size={14} strokeWidth={1.75} aria-hidden="true" />
              <span className="search-trigger-text">{t.topbar.quickSearch}</span>
            </span>
            <span className="kbd-group" aria-hidden="true">
              <span className="kbd">Ctrl</span>
              <span className="kbd">K</span>
            </span>
          </button>

          <div className="sidebar-scroll" ref={scrollRef}>
            <div className="nav-active-pill" ref={pillRef} aria-hidden="true" />
            <div className="nav-group">
              <div className="nav-section-label">{t.navSection}</div>
              {ROUTE_ORDER.map((id) => {
                const Icon = NAV_ICONS[id];
                const isActive = route === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      btnRefs.current[id] = el;
                    }}
                    type="button"
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      navigate(id);
                      setMobileOpen(false);
                    }}
                  >
                    <span className="nav-item-main">
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      <span className="nav-label">{t.nav[id].label}</span>
                    </span>
                    {id === 'installed' && updatesCount > 0 && (
                      <span className="nav-count is-warning">{updatesCount}</span>
                    )}
                    {id === 'queue' && (activeQueueCount > 0 || isProcessingQueue) && (
                      <span className="nav-count is-positive">{activeQueueCount || '●'}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="env-card">
              <div className="env-card-head">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <HardDrive size={13} strokeWidth={1.75} aria-hidden="true" />
                  {t.topbar.runtimeEnv}
                </span>
                <span className={`badge ${envInfo?.isPortable ? 'badge-info' : 'badge-positive'}`}>
                  {envInfo?.isPortable ? 'Portable' : 'Installed'}
                </span>
              </div>
              <div className="env-card-meta">
                <span translate="no">Winget CLI</span>
                <span className="mono tabular">
                  {envInfo ? envInfo.wingetVersion : t.topbar.checking}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="customizer-dock"
              aria-expanded={isCustomizerOpen}
              aria-label={t.overlays.customizerTitle}
              onClick={() => setCustomizerOpen(!isCustomizerOpen)}
            >
              <span className="customizer-dock-left">
                <span className="customizer-icon-box" aria-hidden="true">
                  <Palette size={15} strokeWidth={1.75} />
                </span>
                <span className="customizer-meta">
                  <span className="customizer-title">{t.topbar.appearance}</span>
                  <span className="customizer-sub">
                    {isDarkNow ? 'Dark' : 'Light'} · {prefs.language.toUpperCase()}
                  </span>
                </span>
              </span>
              <span className="customizer-right" aria-hidden="true">
                <span className="kbd">Ctrl+.</span>
              </span>
            </button>
          </div>
        </aside>

        <div
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        <div className="workspace-frame">
          <div className="main-surface">
            <header className="topbar">
              <div className="topbar-left">
                <button
                  type="button"
                  className="icon-btn icon-btn-outline mobile-menu-btn"
                  aria-label={t.topbar.openMenu}
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <h1 className="page-heading">{currentMeta.title}</h1>
              </div>

              <div className="topbar-right">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => refreshInstalled(false)}
                  disabled={isLoadingInstalled}
                >
                  <RefreshCw
                    size={14}
                    strokeWidth={1.75}
                    className={isLoadingInstalled ? 'spin' : undefined}
                    aria-hidden="true"
                  />
                  <span>{isLoadingInstalled ? t.topbar.scanning : t.topbar.scanMachine}</span>
                </button>

                <button
                  type="button"
                  className="icon-btn icon-btn-outline"
                  onClick={toggleThemeQuick}
                  title={t.topbar.toggleTheme}
                  aria-label={t.topbar.toggleTheme}
                >
                  {isDarkNow ? (
                    <Sun size={15} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Moon size={15} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </button>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleBatchInstallFromTopbar}
                  >
                    <Download size={14} strokeWidth={2} aria-hidden="true" />
                    <span className="tabular">{t.topbar.installNow(cartItems.length)}</span>
                  </button>
                )}
              </div>
            </header>

            <main id="main-content" className="main-body" tabIndex={-1}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
