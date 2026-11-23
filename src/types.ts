export type RouteId = 'dashboard' | 'discover' | 'installed' | 'queue' | 'settings';

export type LanguageCode = 'en' | 'vi';
export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentPreset = 'monochrome' | 'emerald' | 'blue' | 'violet';
export type RadiusPreset = 'sharp' | 'default' | 'rounded';
export type DensityPreset = 'comfortable' | 'compact';
export type MotionPreset = 'full' | 'off';

export interface UiPrefs {
  language: LanguageCode;
  theme: ThemeMode;
  accent: AccentPreset;
  radius: RadiusPreset;
  density: DensityPreset;
  motion: MotionPreset;
  sidebarCollapsed: boolean;
}

export interface PackageItem {
  id: string;
  name: string;
  version: string;
  availableVersion?: string | null;
  source: string;
  isInstalled: boolean;
  hasUpdate: boolean;
  category?: string | null;
  summary?: string | null;
  publisher?: string | null;
  tags: string[];
  storeUrl?: string | null;
}

export interface PackageDetails {
  id: string;
  name: string;
  version: string;
  publisher?: string | null;
  publisherUrl?: string | null;
  homepage?: string | null;
  license?: string | null;
  description?: string | null;
  installerType?: string | null;
  installerUrl?: string | null;
  source: string;
  storeUrl?: string | null;
  rawOutput: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  source: string;
  category: string;
  summary: string;
  publisher: string;
  tags: string[];
  popular: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  installedVersion?: string | null;
  availableVersion?: string | null;
  storeUrl?: string | null;
}

export interface InstalledRecord {
  id: string;
  name: string;
  version: string;
  availableVersion?: string | null;
  source: string;
}

export type QueueOperation = 'install' | 'upgrade' | 'uninstall';
export type QueueStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

export interface QueueItem {
  uid: string;
  id: string;
  name: string;
  source: string;
  operation: QueueOperation;
  status: QueueStatus;
  progress: number;
  message: string;
  storeUrl?: string | null;
}

export interface EnqueueItemInput {
  id: string;
  name: string;
  source: string;
  operation: QueueOperation;
}

export interface QueueLogEntry {
  id: string;
  uid?: string | null;
  line: string;
  level: 'info' | 'success' | 'error' | 'muted' | string;
  timestamp: string;
}

export type QueueStreamEvent =
  | { kind: 'snapshot'; items: QueueItem[]; isProcessing: boolean }
  | { kind: 'itemUpdated'; item: QueueItem }
  | { kind: 'log'; uid?: string | null; line: string; level: string; timestamp: string }
  | { kind: 'workerState'; isProcessing: boolean };

export interface AppSettings {
  silentMode: boolean;
  acceptAgreements: boolean;
  scope: 'default' | 'user' | 'machine';
  runAsAdmin: boolean;
  customInstallDir: string;
  defaultSource: 'all' | 'winget' | 'msstore';
  autoOpenQueueOnInstall: boolean;
}

export interface EnvInfo {
  wingetAvailable: boolean;
  wingetVersion: string;
  osVersion: string;
  isPortable: boolean;
  dataDir: string;
  exeDir: string;
}

export interface ToastItem {
  id: string;
  message: string;
  tone: 'info' | 'positive' | 'negative';
}
