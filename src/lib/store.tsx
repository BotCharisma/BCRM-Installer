import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getTranslations, type Translations } from './i18n';
import { invoke } from './tauri';
import { useQueueStream } from './useQueueStream';
import type {
  AppSettings,
  CatalogItem,
  EnqueueItemInput,
  EnvInfo,
  InstalledRecord,
  LanguageCode,
  PackageItem,
  QueueItem,
  QueueLogEntry,
  QueueStreamEvent,
  RouteId,
  ToastItem,
  UiPrefs,
} from '../types';

const PREFS_KEY = 'bcrm_winget_prefs_v1';
const ROUTE_KEY = 'bcrm_winget_dev_route_v1';

const DEFAULT_PREFS: UiPrefs = {
  language: 'en',
  theme: 'dark',
  accent: 'monochrome',
  radius: 'default',
  density: 'comfortable',
  motion: 'full',
  sidebarCollapsed: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  silentMode: true,
  acceptAgreements: true,
  scope: 'default',
  runAsAdmin: false,
  customInstallDir: '',
  defaultSource: 'all',
  autoOpenQueueOnInstall: false,
};

function readInitialPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function parseRouteFromHash(): RouteId {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (
    hash === 'dashboard' ||
    hash === 'discover' ||
    hash === 'installed' ||
    hash === 'queue' ||
    hash === 'settings'
  ) {
    return hash;
  }
  try {
    const saved = localStorage.getItem(ROUTE_KEY);
    if (
      saved === 'dashboard' ||
      saved === 'discover' ||
      saved === 'installed' ||
      saved === 'queue' ||
      saved === 'settings'
    ) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'dashboard';
}

export interface CartPackage {
  id: string;
  name: string;
  source: string;
}

interface AppContextValue {
  route: RouteId;
  navigate: (next: RouteId) => void;
  language: LanguageCode;
  t: Translations;
  prefs: UiPrefs;
  updatePrefs: (patch: Partial<UiPrefs>) => void;
  toggleThemeQuick: () => void;

  envInfo: EnvInfo | null;
  settings: AppSettings;
  saveSettings: (next: AppSettings) => Promise<void>;

  installed: InstalledRecord[];
  isLoadingInstalled: boolean;
  refreshInstalled: (silent?: boolean) => Promise<void>;

  catalog: CatalogItem[];
  refreshCatalog: () => Promise<void>;

  cart: Record<string, CartPackage>;
  toggleCart: (pkg: CartPackage) => void;
  clearCart: () => void;

  queue: QueueItem[];
  isProcessingQueue: boolean;
  logs: QueueLogEntry[];
  clearLogs: () => void;
  enqueuePackages: (items: EnqueueItemInput[], navigateToQueue?: boolean) => Promise<void>;
  skipQueueItem: (uid: string) => Promise<void>;
  cancelQueueItem: (uid: string) => Promise<void>;
  retryFailedQueue: () => Promise<void>;
  clearCompletedQueue: () => Promise<void>;

  drawerPackage: PackageItem | null;
  openPackageDrawer: (pkg: PackageItem) => void;
  closePackageDrawer: () => void;

  isCommandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  isCustomizerOpen: boolean;
  setCustomizerOpen: (open: boolean) => void;

  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastItem['tone']) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<RouteId>(() => parseRouteFromHash());
  const [prefs, setPrefs] = useState<UiPrefs>(() => readInitialPrefs());
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [installed, setInstalled] = useState<InstalledRecord[]>([]);
  const [isLoadingInstalled, setIsLoadingInstalled] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<Record<string, CartPackage>>({});
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [logs, setLogs] = useState<QueueLogEntry[]>([]);
  const [drawerPackage, setDrawerPackage] = useState<PackageItem | null>(null);
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [isCustomizerOpen, setCustomizerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const applyPrefsToDom = useCallback((next: UiPrefs) => {
    const root = document.documentElement;
    const resolvedTheme =
      next.theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : next.theme;
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('lang', next.language);
    root.setAttribute('data-accent', next.accent);
    root.setAttribute('data-radius', next.radius);
    root.setAttribute('data-density', next.density);
    root.setAttribute('data-motion', next.motion);
  }, []);

  const language: LanguageCode = prefs.language === 'vi' ? 'vi' : 'en';
  const t = useMemo(() => getTranslations(language), [language]);

  useEffect(() => {
    applyPrefsToDom(prefs);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs, applyPrefsToDom]);

  useEffect(() => {
    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyPrefsToDom(prefs);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [prefs, applyPrefsToDom]);

  const navigate = useCallback((next: RouteId) => {
    setRoute(next);
    window.location.hash = `#/${next}`;
    try {
      localStorage.setItem(ROUTE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Flush route & prefs on pagehide / HMR dispose (sgc-optimize-tauri-backend Step 9)
  useEffect(() => {
    const flushState = () => {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        localStorage.setItem(ROUTE_KEY, route);
      } catch {
        // ignore
      }
    };
    window.addEventListener('pagehide', flushState);
    if (import.meta.hot) {
      import.meta.hot.dispose(flushState);
    }
    return () => window.removeEventListener('pagehide', flushState);
  }, [prefs, route]);

  const updatePrefs = useCallback((patch: Partial<UiPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleThemeQuick = useCallback(() => {
    setPrefs((prev) => {
      const currentDark =
        prev.theme === 'dark' ||
        (prev.theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches);
      return { ...prev, theme: currentDark ? 'light' : 'dark' };
    });
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const items = await invoke<CatalogItem[]>('get_curated_catalog');
      setCatalog(items);
    } catch {
      // ignore
    }
  }, []);

  const refreshInstalled = useCallback(
    async (silent = false) => {
      setIsLoadingInstalled(true);
      try {
        const rows = await invoke<InstalledRecord[]>('list_installed');
        setInstalled(rows);
        await refreshCatalog();
        if (!silent) {
          pushToast(t.toasts.scannedApps(rows.length), 'positive');
        }
      } catch (err) {
        if (!silent) {
          pushToast(t.toasts.scanError(String(err)), 'negative');
        }
      } finally {
        setIsLoadingInstalled(false);
      }
    },
    [refreshCatalog, pushToast, t],
  );

  // Initial hydration
  useEffect(() => {
    (async () => {
      try {
        const [env, loadedSettings, initialCatalog, initialQueue] = await Promise.all([
          invoke<EnvInfo>('get_env_info'),
          invoke<AppSettings>('get_settings'),
          invoke<CatalogItem[]>('get_curated_catalog'),
          invoke<{ items: QueueItem[]; isProcessing: boolean }>('get_queue'),
        ]);
        setEnvInfo(env);
        setSettings(loadedSettings);
        setCatalog(initialCatalog);
        setQueue(initialQueue.items ?? []);
        setIsProcessingQueue(Boolean(initialQueue.isProcessing));
      } catch {
        // ignore boot failure in preview
      }
      refreshInstalled(true);
    })();
  }, [refreshInstalled]);

  const handleStreamEvent = useCallback(
    (event: QueueStreamEvent) => {
      if (event.kind === 'snapshot') {
        setQueue(event.items);
        setIsProcessingQueue(event.isProcessing);
      } else if (event.kind === 'itemUpdated') {
        setQueue((prev) => {
          const idx = prev.findIndex((q) => q.uid === event.item.uid);
          if (idx === -1) return [...prev, event.item];
          const next = [...prev];
          next[idx] = event.item;
          return next;
        });
        if (event.item.status === 'completed') {
          refreshInstalled(true);
        }
      } else if (event.kind === 'log') {
        setLogs((prev) => [
          ...prev.slice(-399),
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            uid: event.uid,
            line: event.line,
            level: event.level,
            timestamp: event.timestamp,
          },
        ]);
      } else if (event.kind === 'workerState') {
        setIsProcessingQueue(event.isProcessing);
      }
    },
    [refreshInstalled],
  );

  useQueueStream(handleStreamEvent);

  const saveSettings = useCallback(
    async (next: AppSettings) => {
      const saved = await invoke<AppSettings>('patch_settings', next as unknown as Record<string, unknown>);
      setSettings(saved);
      pushToast(t.toasts.settingsSaved, 'positive');
    },
    [pushToast, t],
  );

  const toggleCart = useCallback((pkg: CartPackage) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[pkg.id]) {
        delete next[pkg.id];
      } else {
        next[pkg.id] = pkg;
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const enqueuePackages = useCallback(
    async (items: EnqueueItemInput[], navigateToQueue?: boolean) => {
      if (items.length === 0) return;
      try {
        const updated = await invoke<QueueItem[]>('enqueue_batch', { items });
        setQueue(updated);
        pushToast(t.toasts.enqueuedApps(items.length), 'positive');
        if (navigateToQueue ?? settings.autoOpenQueueOnInstall) {
          navigate('queue');
        }
      } catch (err) {
        pushToast(t.toasts.enqueueError(String(err)), 'negative');
      }
    },
    [navigate, pushToast, settings.autoOpenQueueOnInstall, t],
  );

  const skipQueueItem = useCallback(async (uid: string) => {
    const updated = await invoke<QueueItem[]>('skip_item', { uid });
    setQueue(updated);
  }, []);

  const cancelQueueItem = useCallback(async (uid: string) => {
    const updated = await invoke<QueueItem[]>('cancel_item', { uid });
    setQueue(updated);
  }, []);

  const retryFailedQueue = useCallback(async () => {
    const updated = await invoke<QueueItem[]>('retry_failed');
    setQueue(updated);
  }, []);

  const clearCompletedQueue = useCallback(async () => {
    const updated = await invoke<QueueItem[]>('clear_completed');
    setQueue(updated);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // Global keyboard shortcuts: Ctrl+K (Command Palette) & Ctrl+. (Customizer)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        setCustomizerOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setCommandOpen(false);
        setCustomizerOpen(false);
        setDrawerPackage(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      route,
      navigate,
      language,
      t,
      prefs,
      updatePrefs,
      toggleThemeQuick,
      envInfo,
      settings,
      saveSettings,
      installed,
      isLoadingInstalled,
      refreshInstalled,
      catalog,
      refreshCatalog,
      cart,
      toggleCart,
      clearCart,
      queue,
      isProcessingQueue,
      logs,
      clearLogs,
      enqueuePackages,
      skipQueueItem,
      cancelQueueItem,
      retryFailedQueue,
      clearCompletedQueue,
      drawerPackage,
      openPackageDrawer: setDrawerPackage,
      closePackageDrawer: () => setDrawerPackage(null),
      isCommandOpen,
      setCommandOpen,
      isCustomizerOpen,
      setCustomizerOpen,
      toasts,
      pushToast,
    }),
    [
      route,
      navigate,
      language,
      t,
      prefs,
      updatePrefs,
      toggleThemeQuick,
      envInfo,
      settings,
      saveSettings,
      installed,
      isLoadingInstalled,
      refreshInstalled,
      catalog,
      refreshCatalog,
      cart,
      toggleCart,
      clearCart,
      queue,
      isProcessingQueue,
      logs,
      clearLogs,
      enqueuePackages,
      skipQueueItem,
      cancelQueueItem,
      retryFailedQueue,
      clearCompletedQueue,
      drawerPackage,
      isCommandOpen,
      isCustomizerOpen,
      toasts,
      pushToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
