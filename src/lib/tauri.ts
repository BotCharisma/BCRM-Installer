import { invoke as tauriInvoke, type InvokeArgs, type InvokeOptions } from '@tauri-apps/api/core';
import type {
  AppSettings,
  CatalogItem,
  EnvInfo,
  InstalledRecord,
  PackageDetails,
  PackageItem,
  QueueItem,
} from '../types';

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const COMMAND_ROUTES: Record<string, { command: string; action: string }> = {
  search_packages: { command: 'package_command', action: 'search_packages' },
  get_package_details: { command: 'package_command', action: 'get_package_details' },
  list_installed: { command: 'package_command', action: 'list_installed' },
  get_curated_catalog: { command: 'package_command', action: 'get_curated_catalog' },

  get_queue: { command: 'queue_command', action: 'get_queue' },
  enqueue_batch: { command: 'queue_command', action: 'enqueue_batch' },
  skip_item: { command: 'queue_command', action: 'skip_item' },
  cancel_item: { command: 'queue_command', action: 'cancel_item' },
  retry_failed: { command: 'queue_command', action: 'retry_failed' },
  clear_completed: { command: 'queue_command', action: 'clear_completed' },

  get_settings: { command: 'settings_command', action: 'get_settings' },
  patch_settings: { command: 'settings_command', action: 'patch_settings' },

  get_env_info: { command: 'system_command', action: 'get_env_info' },
  open_ms_store: { command: 'system_command', action: 'open_ms_store' },
  open_data_dir: { command: 'system_command', action: 'open_data_dir' },
  open_external_url: { command: 'system_command', action: 'open_external_url' },
};

// Web-only preview fallback when running `npm run dev:web` without Tauri desktop shell
const PREVIEW_INSTALLED: InstalledRecord[] = [
  { id: 'Google.Chrome', name: 'Google Chrome', version: '130.0.6723.92', availableVersion: '131.0.6778.86', source: 'winget' },
  { id: 'Microsoft.VisualStudioCode', name: 'Visual Studio Code', version: '1.95.2', availableVersion: null, source: 'winget' },
  { id: 'Git.Git', name: 'Git', version: '2.46.2', availableVersion: '2.47.1', source: 'winget' },
  { id: '7zip.7zip', name: '7-Zip 24.08 (x64)', version: '24.08', availableVersion: null, source: 'winget' },
  { id: '9NKSQGP7F2NH', name: 'WhatsApp', version: '2.2446.5.0', availableVersion: '2.2448.1.0', source: 'msstore' },
  { id: '9NBLGGH5L9XT', name: 'EarTrumpet', version: '2.3.0.0', availableVersion: null, source: 'msstore' },
];

const PREVIEW_CATALOG: CatalogItem[] = [
  { id: 'Google.Chrome', name: 'Google Chrome', source: 'winget', category: 'Trình duyệt & Web', summary: 'Trình duyệt web phổ biến của Google với tốc độ cao.', publisher: 'Google LLC', tags: ['browser'], popular: true, isInstalled: true, hasUpdate: true, installedVersion: '130.0.6723.92', availableVersion: '131.0.6778.86' },
  { id: 'Microsoft.VisualStudioCode', name: 'Visual Studio Code', source: 'winget', category: 'Lập trình & Dev Tools', summary: 'Trình soạn thảo mã nguồn hàng đầu hỗ trợ kho extension phong phú.', publisher: 'Microsoft', tags: ['ide'], popular: true, isInstalled: true, hasUpdate: false, installedVersion: '1.95.2', availableVersion: null },
  { id: '7zip.7zip', name: '7-Zip', source: 'winget', category: 'Tiện ích Hệ thống', summary: 'Công cụ nén và giải nén file tốc độ cao hỗ trợ 7z, zip, rar.', publisher: 'Igor Pavlov', tags: ['archive'], popular: true, isInstalled: true, hasUpdate: false, installedVersion: '24.08', availableVersion: null },
  { id: 'VideoLAN.VLC', name: 'VLC Media Player', source: 'winget', category: 'Media & Thiết kế', summary: 'Trình phát đa phương tiện đọc mọi định dạng video/audio.', publisher: 'VideoLAN', tags: ['video'], popular: true, isInstalled: false, hasUpdate: false },
  { id: 'Microsoft.PowerToys', name: 'Microsoft PowerToys', source: 'winget', category: 'Tiện ích Hệ thống', summary: 'Bộ tiện ích nâng cấp Windows: FancyZones, Color Picker, OCR.', publisher: 'Microsoft', tags: ['windows'], popular: true, isInstalled: false, hasUpdate: false },
  { id: '9NKSQGP7F2NH', name: 'WhatsApp', source: 'msstore', category: 'Microsoft Store', summary: 'Ứng dụng WhatsApp chính chủ trên Microsoft Store cho Windows.', publisher: 'WhatsApp Inc.', tags: ['msstore'], popular: true, isInstalled: true, hasUpdate: true, installedVersion: '2.2446.5.0', availableVersion: '2.2448.1.0', storeUrl: 'ms-windows-store://pdp/?ProductId=9NKSQGP7F2NH' },
  { id: '9NBLGGH5L9XT', name: 'EarTrumpet', source: 'msstore', category: 'Microsoft Store', summary: 'Điều chỉnh âm lượng riêng cho từng ứng dụng trên taskbar.', publisher: 'File-New-Project', tags: ['msstore'], popular: true, isInstalled: true, hasUpdate: false, installedVersion: '2.3.0.0', storeUrl: 'ms-windows-store://pdp/?ProductId=9NBLGGH5L9XT' },
];

let previewSettings: AppSettings = {
  silentMode: true,
  acceptAgreements: true,
  scope: 'default',
  runAsAdmin: false,
  customInstallDir: '',
  defaultSource: 'all',
  autoOpenQueueOnInstall: false,
};

let previewQueue: QueueItem[] = [];

async function webPreviewFallback<T>(cmd: string, args?: InvokeArgs): Promise<T> {
  const payload = (args ?? {}) as Record<string, unknown>;
  switch (cmd) {
    case 'list_installed':
      return PREVIEW_INSTALLED as T;
    case 'get_curated_catalog':
      return PREVIEW_CATALOG as T;
    case 'search_packages': {
      const q = String(payload.query ?? '').toLowerCase();
      const source = String(payload.source ?? 'all');
      const matches: PackageItem[] = PREVIEW_CATALOG.filter((c) => {
        const matchSource = source === 'all' || c.source === source;
        const matchQuery =
          !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q);
        return matchSource && matchQuery;
      }).map((c) => ({
        id: c.id,
        name: c.name,
        version: c.installedVersion ?? 'Latest',
        availableVersion: c.availableVersion,
        source: c.source,
        isInstalled: c.isInstalled,
        hasUpdate: c.hasUpdate,
        category: c.category,
        summary: c.summary,
        publisher: c.publisher,
        tags: c.tags,
        storeUrl: c.storeUrl,
      }));
      return matches as T;
    }
    case 'get_package_details': {
      const id = String(payload.id ?? '');
      const found = PREVIEW_CATALOG.find((c) => c.id === id);
      const details: PackageDetails = {
        id,
        name: found?.name ?? id,
        version: found?.installedVersion ?? 'Latest',
        publisher: found?.publisher ?? 'Microsoft / Community',
        homepage: 'https://learn.microsoft.com/windows/package-manager/',
        license: 'Standard License',
        description: found?.summary ?? 'Thông tin chi tiết gói phần mềm (Chế độ Preview Web).',
        installerType: found?.source === 'msstore' ? 'msstore' : 'exe / msi',
        source: found?.source ?? String(payload.source ?? 'winget'),
        storeUrl: found?.source === 'msstore' ? `ms-windows-store://pdp/?ProductId=${id}` : null,
        rawOutput: `Preview mode: winget show --id ${id}`,
      };
      return details as T;
    }
    case 'get_settings':
      return previewSettings as T;
    case 'patch_settings':
      previewSettings = { ...previewSettings, ...(payload as unknown as AppSettings) };
      return previewSettings as T;
    case 'get_env_info':
      return {
        wingetAvailable: true,
        wingetVersion: 'Web Preview (Mock)',
        osVersion: 'Windows (Browser Preview)',
        isPortable: true,
        dataDir: './data',
        exeDir: '.',
      } satisfies EnvInfo as T;
    case 'get_queue':
      return { items: previewQueue, isProcessing: false } as T;
    case 'enqueue_batch': {
      const items = (payload.items as Array<{ id: string; name: string; source: string; operation: QueueItem['operation'] }>) ?? [];
      previewQueue = [
        ...previewQueue,
        ...items.map((it, i) => ({
          uid: `preview-${Date.now()}-${i}`,
          id: it.id,
          name: it.name,
          source: it.source,
          operation: it.operation,
          status: 'completed' as const,
          progress: 100,
          message: 'Mô phỏng hoàn tất (chạy bằng npm run dev:app để cài thật)',
          storeUrl: it.source === 'msstore' ? `ms-windows-store://pdp/?ProductId=${it.id}` : null,
        })),
      ];
      return previewQueue as T;
    }
    case 'clear_completed':
      previewQueue = [];
      return previewQueue as T;
    default:
      return {} as T;
  }
}

export async function invoke<T>(cmd: string, args?: InvokeArgs, options?: InvokeOptions): Promise<T> {
  if (!isTauriRuntime()) {
    return webPreviewFallback<T>(cmd, args);
  }
  const route = COMMAND_ROUTES[cmd];
  if (!route) {
    return tauriInvoke<T>(cmd, args, options);
  }
  return tauriInvoke<T>(route.command, { action: route.action, payload: args ?? {} }, options);
}
