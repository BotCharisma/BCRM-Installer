import type { LanguageCode } from '../types';

export interface Translations {
  skipToMain: string;
  navSection: string;
  nav: {
    dashboard: { label: string; title: string };
    discover: { label: string; title: string };
    installed: { label: string; title: string };
    queue: { label: string; title: string };
    settings: { label: string; title: string };
  };
  topbar: {
    quickSearch: string;
    scanMachine: string;
    scanning: string;
    installNow: (count: number) => string;
    runtimeEnv: string;
    appearance: string;
    toggleTheme: string;
    expandSidebar: string;
    collapseSidebar: string;
    openMenu: string;
    checking: string;
  };
  dashboard: {
    installedApps: string;
    synced: string;
    scanning: string;
    updatesAvailable: string;
    needsUpdate: string;
    upToDate: string;
    updateAll: string;
    allUpToDate: string;
    installQueue: string;
    processing: string;
    idle: string;
    doneInSession: (n: number) => string;
    storageMode: string;
    sourceDistribution: string;
    sourceDistributionSub: string;
    openDiscover: string;
    wingetSource: string;
    msstoreSource: string;
    pendingUpdates: string;
    curatedCatalog: string;
    packagesUnit: string;
    newUnit: string;
    essentialUnit: string;
    categoryCoverage: string;
    categoryCoverageSub: string;
    updatesReadyTitle: string;
    updatesReadySub: string;
    allLatestMsg: string;
    updateBtn: string;
    quickPicksTitle: string;
    quickPicksSub: string;
    installAllN: (n: number) => string;
    allStartersInstalled: string;
    installBtn: string;
  };
  discover: {
    searchPlaceholder: string;
    searchOnline: string;
    searching: string;
    backToCatalog: string;
    sourceAll: string;
    sourceWinget: string;
    sourceMsstore: string;
    catPopular: string;
    catAll: string;
    liveResultsFor: (source: string, term: string) => string;
    packagesCount: (n: number) => string;
    searchingBanner: (term: string, source: string) => string;
    emptyTitle: string;
    emptySub: string;
    searchNowFor: (term: string, source: string) => string;
    defaultSummary: (source: string) => string;
    installed: string;
    newVersion: (v: string) => string;
    details: string;
    update: string;
    reinstall: string;
    downloadInstall: string;
    selectedApps: (n: number) => string;
    sequentialMode: (silent: boolean) => string;
    clearSelection: string;
    installSelected: (n: number) => string;
  };
  installed: {
    allInstalled: (n: number) => string;
    updatesTab: (n: number) => string;
    filterPlaceholder: string;
    allSources: string;
    wingetOnly: string;
    msstoreOnly: string;
    rescan: string;
    updateAll: (n: number) => string;
    selectedCount: (n: number) => string;
    clearSelection: string;
    updateSelected: string;
    uninstallSelected: (n: number) => string;
    colName: string;
    colId: string;
    colCurrent: string;
    colAvailable: string;
    colSource: string;
    colActions: string;
    scanningTable: string;
    emptyTable: string;
    latest: string;
    update: string;
    uninstall: string;
    viewDetails: string;
  };
  queue: {
    workerRunning: string;
    workerIdle: string;
    tasksCount: (n: number) => string;
    retryFailed: string;
    clearCompleted: string;
    taskListTitle: string;
    taskListSub: string;
    emptyTitle: string;
    emptySub: string;
    openDiscover: string;
    statusRunning: string;
    statusCompleted: string;
    statusFailed: string;
    statusSkipped: string;
    statusCancelled: string;
    statusPending: string;
    openMsStore: string;
    skip: string;
    cancel: string;
    terminalTitle: string;
    copy: string;
    clear: string;
    terminalEmpty: string;
  };
  settings: {
    wingetTitle: string;
    wingetSub: string;
    save: string;
    saving: string;
    silentTitle: string;
    silentSub: string;
    agreementsTitle: string;
    agreementsSub: string;
    adminTitle: string;
    adminSub: string;
    scopeTitle: string;
    scopeSub: string;
    scopeDefault: string;
    scopeUser: string;
    scopeMachine: string;
    defaultSourceTitle: string;
    defaultSourceSub: string;
    installDirTitle: string;
    installDirSub: string;
    installDirPlaceholder: string;
    appearanceTitle: string;
    appearanceSub: string;
    languageLabel: string;
    themeModeLabel: string;
    accentLabel: string;
    portableTitle: string;
    portableSub: string;
    settingsPathLabel: string;
    reading: string;
    openDataFolder: string;
    customIconHint: string;
    wingetMissingWarn: string;
  };
  overlays: {
    packageDetails: string;
    closeDetails: string;
    versionLabel: string;
    descriptionLabel: string;
    loadingDetails: string;
    noDescription: string;
    publisherLabel: string;
    licenseLabel: string;
    installerTypeLabel: string;
    homepageLabel: string;
    openWebsite: string;
    cliEquivalent: string;
    copy: string;
    openInMsStore: string;
    uninstall: string;
    updateNow: string;
    reinstall: string;
    downloadInstall: string;
    customizerTitle: string;
    themeMode: string;
    accentColor: string;
    borderRadius: string;
    radiusSharp: string;
    radiusDefault: string;
    radiusRounded: string;
    density: string;
    densityComfortable: string;
    densityCompact: string;
    motion: string;
    motionSmooth: string;
    motionOff: string;
    language: string;
    cmdPlaceholder: string;
    cmdEmpty: string;
    cmdGroupNav: string;
    cmdGroupActions: string;
    cmdGroupCatalog: string;
    cmdToggleTheme: string;
    cmdRescan: string;
    cmdUpgradeAll: string;
  };
  toasts: {
    scannedApps: (n: number) => string;
    scanError: (err: string) => string;
    settingsSaved: string;
    enqueuedApps: (n: number) => string;
    enqueueError: (err: string) => string;
    copiedCmd: string;
    copiedLogs: string;
    clipboardError: string;
    noSearchResults: (term: string, source: string) => string;
    searchError: (err: string) => string;
  };
  categories: Record<string, string>;
}

const EN: Translations = {
  skipToMain: 'Skip to main content',
  navSection: 'Package Manager',
  nav: {
    dashboard: { label: 'Overview', title: 'System Overview' },
    discover: { label: 'Discover', title: 'Discover & Live Search (Winget + MS Store)' },
    installed: { label: 'Installed & Updates', title: 'Installed Apps & Available Updates' },
    queue: { label: 'Queue & Logs', title: 'Install Queue & Live Terminal Logs' },
    settings: { label: 'Settings', title: 'Winget, Appearance & Portable Settings' },
  },
  topbar: {
    quickSearch: 'Quick search…',
    scanMachine: 'Scan PC',
    scanning: 'Scanning…',
    installNow: (n) => `Install Now (${n})`,
    runtimeEnv: 'Runtime Mode',
    appearance: 'Appearance',
    toggleTheme: 'Toggle Dark / Light theme',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    openMenu: 'Open navigation menu',
    checking: 'Checking…',
  },
  dashboard: {
    installedApps: 'Installed Apps',
    synced: 'Synced',
    scanning: 'Scanning…',
    updatesAvailable: 'Updates Available',
    needsUpdate: 'Updates Ready',
    upToDate: 'Up to Date',
    updateAll: 'Update All',
    allUpToDate: 'All packages are up to date',
    installQueue: 'Install Queue',
    processing: 'Running',
    idle: 'Idle',
    doneInSession: (n) => `${n} completed this session`,
    storageMode: 'Storage Mode',
    sourceDistribution: 'Installed Package Sources',
    sourceDistributionSub: 'Distribution across Winget Repository and Microsoft Store',
    openDiscover: 'Open Discover',
    wingetSource: 'Winget CLI Source',
    msstoreSource: 'Microsoft Store Source',
    pendingUpdates: 'Pending Updates',
    curatedCatalog: 'Curated Fast-Pick Apps',
    packagesUnit: 'pkgs',
    newUnit: 'updates',
    essentialUnit: 'essentials',
    categoryCoverage: 'Curated Category Coverage',
    categoryCoverageSub: 'Essential apps already installed on this PC by category',
    updatesReadyTitle: 'Updates Ready to Install',
    updatesReadySub: 'Silent one-click upgrades without manual wizards',
    allLatestMsg: 'Every scanned application is currently on its latest version.',
    updateBtn: 'Update',
    quickPicksTitle: 'Recommended Quick Picks',
    quickPicksSub: 'Popular Windows apps not yet installed on this machine',
    installAllN: (n) => `Install All ${n}`,
    allStartersInstalled: 'You already have all top recommended apps installed. Explore Discover for more!',
    installBtn: 'Install',
  },
  discover: {
    searchPlaceholder: 'Search Winget & Microsoft Store automatically (e.g. PC Manager, Chrome, Figma, WhatsApp)…',
    searchOnline: 'Search',
    searching: 'Searching…',
    backToCatalog: 'Back to Curated',
    sourceAll: 'All Sources',
    sourceWinget: 'Winget CLI',
    sourceMsstore: 'Microsoft Store',
    catPopular: 'Popular',
    catAll: 'All',
    liveResultsFor: (source, term) => `Live results from ${source} for “${term}”`,
    packagesCount: (n) => `${n} packages`,
    searchingBanner: (term, source) => `Searching “${term}” across ${source}…`,
    emptyTitle: 'No matching packages found',
    emptySub: 'Try another keyword or switch source filter to search across Winget & Microsoft Store.',
    searchNowFor: (term, source) => `Search “${term}” on ${source}`,
    defaultSummary: (source) => `Official package from ${source}. Click Details to inspect metadata.`,
    installed: 'Installed',
    newVersion: (v) => `Update ${v}`,
    details: 'Details',
    update: 'Update',
    reinstall: 'Reinstall',
    downloadInstall: 'Install',
    selectedApps: (n) => `${n} apps selected`,
    sequentialMode: (silent) => `Sequential queue (${silent ? 'Silent Mode' : 'Interactive'})`,
    clearSelection: 'Clear',
    installSelected: (n) => `Install Selected (${n})`,
  },
  installed: {
    allInstalled: (n) => `All Installed (${n})`,
    updatesTab: (n) => `Updates Available (${n})`,
    filterPlaceholder: 'Filter by name or package ID…',
    allSources: 'All Sources',
    wingetOnly: 'Winget Only',
    msstoreOnly: 'MS Store Only',
    rescan: 'Rescan',
    updateAll: (n) => `Update All (${n})`,
    selectedCount: (n) => `${n} packages selected`,
    clearSelection: 'Clear',
    updateSelected: 'Update Selected',
    uninstallSelected: (n) => `Uninstall (${n})`,
    colName: 'Application',
    colId: 'Package ID',
    colCurrent: 'Installed',
    colAvailable: 'Available',
    colSource: 'Source',
    colActions: 'Actions',
    scanningTable: 'Running winget list & upgrade check…',
    emptyTable: 'No packages match your current filter.',
    latest: 'Latest',
    update: 'Update',
    uninstall: 'Uninstall',
    viewDetails: 'View details',
  },
  queue: {
    workerRunning: 'Sequential worker active…',
    workerIdle: 'Queue ready',
    tasksCount: (n) => `${n} tasks`,
    retryFailed: 'Retry Failed',
    clearCompleted: 'Clear Finished',
    taskListTitle: 'Sequential Task Queue',
    taskListSub: 'Runs one package at a time to avoid Windows Installer conflicts (1618)',
    emptyTitle: 'Queue is empty',
    emptySub: 'Head to Discover to pick apps or trigger updates from Installed.',
    openDiscover: 'Open Discover',
    statusRunning: 'Running',
    statusCompleted: 'Completed',
    statusFailed: 'Failed',
    statusSkipped: 'Skipped',
    statusCancelled: 'Cancelled',
    statusPending: 'Pending',
    openMsStore: 'Open MS Store',
    skip: 'Skip',
    cancel: 'Cancel',
    terminalTitle: 'Live Winget Output Stream',
    copy: 'Copy',
    clear: 'Clear',
    terminalEmpty: 'Waiting for winget output… Real-time CLI logs appear here as packages install or upgrade.',
  },
  settings: {
    wingetTitle: 'Winget CLI Execution',
    wingetSub: 'Configure flags passed to winget.exe for install, upgrade, and uninstall',
    save: 'Save Settings',
    saving: 'Saving…',
    silentTitle: 'Silent Mode',
    silentSub: 'Pass --silent to skip interactive installer wizards. Disable for --interactive.',
    agreementsTitle: 'Auto-Accept Agreements',
    agreementsSub: 'Pass --accept-package-agreements and --accept-source-agreements automatically.',
    adminTitle: 'Run as Administrator (UAC)',
    adminSub: 'Elevate winget via UAC prompt for system-wide installers.',
    scopeTitle: 'Installation Scope',
    scopeSub: 'Install for the current user or all users (machine).',
    scopeDefault: 'Default',
    scopeUser: 'User (--scope user)',
    scopeMachine: 'Machine (--scope machine)',
    defaultSourceTitle: 'Default Search Source',
    defaultSourceSub: 'Initial source filter when opening Discover.',
    installDirTitle: 'Custom Install Location',
    installDirSub: 'Leave blank to use each installer’s default path (--location).',
    installDirPlaceholder: 'e.g. D:\\Apps',
    appearanceTitle: 'Appearance & Language',
    appearanceSub: 'Bundled offline Lexend typeface with Dual-Theme support',
    languageLabel: 'Interface Language',
    themeModeLabel: 'Theme Mode',
    accentLabel: 'Accent Color',
    portableTitle: 'Portable & Data Storage',
    portableSub: 'Automatically detects portable.mode alongside bcrm-winget.exe',
    settingsPathLabel: 'Settings Storage Directory',
    reading: 'Reading…',
    openDataFolder: 'Open Data Folder',
    customIconHint: 'Custom App Icon: Run npm.cmd run icon:apply <path-to-icon.png> to regenerate all .ico & .png icons.',
    wingetMissingWarn: 'winget.exe was not detected on this PC. Update App Installer from Microsoft Store.',
  },
  overlays: {
    packageDetails: 'Package Details',
    closeDetails: 'Close details',
    versionLabel: 'Version',
    descriptionLabel: 'Description',
    loadingDetails: 'Loading metadata from winget show…',
    noDescription: 'No detailed description available for this package.',
    publisherLabel: 'Publisher',
    licenseLabel: 'License',
    installerTypeLabel: 'Installer Type',
    homepageLabel: 'Homepage',
    openWebsite: 'Open Website',
    cliEquivalent: 'Equivalent Winget Command',
    copy: 'Copy',
    openInMsStore: 'Open in Microsoft Store',
    uninstall: 'Uninstall',
    updateNow: 'Update Now',
    reinstall: 'Reinstall',
    downloadInstall: 'Download & Install',
    customizerTitle: 'Theme Customizer',
    themeMode: 'Color Mode',
    accentColor: 'Accent Color',
    borderRadius: 'Border Radius',
    radiusSharp: 'Sharp',
    radiusDefault: 'Default',
    radiusRounded: 'Rounded',
    density: 'Density',
    densityComfortable: 'Comfy',
    densityCompact: 'Compact',
    motion: 'Motion',
    motionSmooth: 'Smooth',
    motionOff: 'Off',
    language: 'Language',
    cmdPlaceholder: 'Jump to page, quick action, or curated app…',
    cmdEmpty: 'No matching command. Open Discover to search Winget & Microsoft Store live.',
    cmdGroupNav: 'Navigation',
    cmdGroupActions: 'Quick Actions',
    cmdGroupCatalog: 'Curated Apps',
    cmdToggleTheme: 'Toggle Dark / Light Mode',
    cmdRescan: 'Rescan Installed Applications',
    cmdUpgradeAll: 'Update All Outdated Apps',
  },
  toasts: {
    scannedApps: (n) => `Scanned ${n} installed packages`,
    scanError: (err) => `Failed to scan installed apps: ${err}`,
    settingsSaved: 'Winget settings saved',
    enqueuedApps: (n) => `Added ${n} package(s) to the install queue`,
    enqueueError: (err) => `Failed to enqueue packages: ${err}`,
    copiedCmd: 'Winget command copied to clipboard',
    copiedLogs: 'Terminal logs copied to clipboard',
    clipboardError: 'Unable to access clipboard',
    noSearchResults: (term, source) => `No packages found for “${term}” on ${source}`,
    searchError: (err) => `Winget search error: ${err}`,
  },
  categories: {
    'Trình duyệt & Web': 'Browsers & Web',
    'Lập trình & Dev Tools': 'Developer Tools',
    'Media & Thiết kế': 'Media & Design',
    'Văn phòng & Học tập': 'Office & Study',
    'Tiện ích Hệ thống': 'System Utilities',
    'Gaming & Giao tiếp': 'Gaming & Chat',
    'Microsoft Store': 'Microsoft Store',
  },
};

const VI: Translations = {
  skipToMain: 'Bỏ qua tới nội dung chính',
  navSection: 'Quản lý gói',
  nav: {
    dashboard: { label: 'Tổng quan', title: 'Tổng quan hệ thống' },
    discover: { label: 'Kho Ứng Dụng', title: 'Kho Ứng Dụng & Tìm kiếm (Winget + MS Store)' },
    installed: { label: 'Đã Cài & Cập Nhật', title: 'Ứng dụng đã cài & Bản cập nhật' },
    queue: { label: 'Hàng Đợi & Logs', title: 'Hàng đợi cài đặt & Terminal Logs' },
    settings: { label: 'Cài Đặt', title: 'Cài đặt Winget, Giao diện & Portable' },
  },
  topbar: {
    quickSearch: 'Tìm nhanh…',
    scanMachine: 'Quét máy',
    scanning: 'Đang quét…',
    installNow: (n) => `Cài đặt ngay (${n})`,
    runtimeEnv: 'Môi trường chạy',
    appearance: 'Giao diện',
    toggleTheme: 'Chuyển đổi Dark / Light mode',
    expandSidebar: 'Mở rộng thanh bên',
    collapseSidebar: 'Thu gọn thanh bên',
    openMenu: 'Mở menu điều hướng',
    checking: 'Đang kiểm tra…',
  },
  dashboard: {
    installedApps: 'App đã cài trên máy',
    synced: 'Đồng bộ',
    scanning: 'Đang quét…',
    updatesAvailable: 'Bản cập nhật khả dụng',
    needsUpdate: 'Cần cập nhật',
    upToDate: 'Mới nhất',
    updateAll: 'Cập nhật tất cả',
    allUpToDate: 'Mọi phần mềm đều mới nhất',
    installQueue: 'Hàng đợi cài đặt',
    processing: 'Đang xử lý',
    idle: 'Nhàn rỗi',
    doneInSession: (n) => `Đã xong ${n} tác vụ trong phiên`,
    storageMode: 'Chế độ lưu trữ',
    sourceDistribution: 'Phân bổ nguồn cài đặt trên máy',
    sourceDistributionSub: 'Tỷ lệ ứng dụng được quản lý qua Winget Repository và Microsoft Store',
    openDiscover: 'Mở Kho App',
    wingetSource: 'Nguồn Winget CLI',
    msstoreSource: 'Nguồn Microsoft Store',
    pendingUpdates: 'Chờ cập nhật phiên bản',
    curatedCatalog: 'Kho app gợi ý chọn nhanh',
    packagesUnit: 'gói',
    newUnit: 'bản mới',
    essentialUnit: 'app thiết yếu',
    categoryCoverage: 'Mức độ phủ theo danh mục phổ biến',
    categoryCoverageSub: 'So sánh số ứng dụng thiết yếu đã có trên máy theo từng nhóm',
    updatesReadyTitle: 'Bản cập nhật cần xử lý',
    updatesReadySub: 'Cập nhật tự động không cần bấm Next thủ công',
    allLatestMsg: 'Tất cả ứng dụng được quét hiện đang ở phiên bản mới nhất.',
    updateBtn: 'Cập nhật',
    quickPicksTitle: 'Gợi ý cài nhanh cho máy',
    quickPicksSub: 'Các app phổ biến chưa có trong hệ thống của bạn',
    installAllN: (n) => `Cài cả ${n} app`,
    allStartersInstalled: 'Bạn đã cài đầy đủ các ứng dụng gợi ý hàng đầu. Hãy vào Kho Ứng Dụng để tìm thêm!',
    installBtn: 'Cài',
  },
  discover: {
    searchPlaceholder: 'Nhập tên app để tự động tra cứu trên tất cả nguồn (vd: PC Manager, Chrome, WhatsApp)…',
    searchOnline: 'Tìm kiếm',
    searching: 'Đang tìm…',
    backToCatalog: 'Quay lại Kho gợi ý',
    sourceAll: 'Tất cả nguồn',
    sourceWinget: 'Winget CLI',
    sourceMsstore: 'Microsoft Store',
    catPopular: 'Phổ biến nhất',
    catAll: 'Tất cả',
    liveResultsFor: (source, term) => `Kết quả trực tiếp từ ${source} cho “${term}”`,
    packagesCount: (n) => `${n} gói`,
    searchingBanner: (term, source) => `Đang tự động tra cứu “${term}” trên ${source}…`,
    emptyTitle: 'Không tìm thấy ứng dụng phù hợp',
    emptySub: 'Thử từ khóa khác hoặc chuyển bộ lọc sang Tất cả nguồn (Winget + MS Store).',
    searchNowFor: (term, source) => `Tra cứu “${term}” trên ${source}`,
    defaultSummary: (source) => `Gói phần mềm chính thức từ nguồn ${source}. Nhấn Chi tiết để xem thông tin đầy đủ.`,
    installed: 'Đã cài',
    newVersion: (v) => `Bản mới ${v}`,
    details: 'Chi tiết',
    update: 'Cập nhật',
    reinstall: 'Cài lại',
    downloadInstall: 'Tải & Cài',
    selectedApps: (n) => `Đã chọn ${n} ứng dụng`,
    sequentialMode: (silent) => `Cài đặt tuần tự (${silent ? 'Silent Mode' : 'Interactive'})`,
    clearSelection: 'Bỏ chọn',
    installSelected: (n) => `Tải & Cài ngay (${n})`,
  },
  installed: {
    allInstalled: (n) => `Tất cả đã cài (${n})`,
    updatesTab: (n) => `Có bản cập nhật (${n})`,
    filterPlaceholder: 'Lọc theo tên hoặc Package ID…',
    allSources: 'Mọi nguồn',
    wingetOnly: 'Nguồn winget',
    msstoreOnly: 'Nguồn msstore',
    rescan: 'Quét lại',
    updateAll: (n) => `Cập nhật tất cả (${n})`,
    selectedCount: (n) => `Đã chọn ${n} phần mềm`,
    clearSelection: 'Bỏ chọn',
    updateSelected: 'Cập nhật đã chọn',
    uninstallSelected: (n) => `Gỡ cài đặt (${n})`,
    colName: 'Tên ứng dụng',
    colId: 'Package ID',
    colCurrent: 'Đang cài',
    colAvailable: 'Bản mới',
    colSource: 'Nguồn',
    colActions: 'Thao tác',
    scanningTable: 'Đang chạy winget list & kiểm tra cập nhật…',
    emptyTable: 'Không có phần mềm nào khớp với bộ lọc hiện tại.',
    latest: 'Mới nhất',
    update: 'Cập nhật',
    uninstall: 'Gỡ',
    viewDetails: 'Xem chi tiết',
  },
  queue: {
    workerRunning: 'Đang cài đặt tuần tự…',
    workerIdle: 'Hàng đợi sẵn sàng',
    tasksCount: (n) => `${n} tác vụ`,
    retryFailed: 'Thử lại gói lỗi',
    clearCompleted: 'Dọn lịch sử xong',
    taskListTitle: 'Danh sách tác vụ tuần tự',
    taskListSub: 'Chạy lần lượt từng gói để tránh xung đột Windows Installer (lỗi 1618)',
    emptyTitle: 'Hàng đợi đang trống',
    emptySub: 'Vào Kho Ứng Dụng để chọn app cần tải hoặc cập nhật hàng loạt.',
    openDiscover: 'Mở Kho Ứng Dụng',
    statusRunning: 'Đang chạy',
    statusCompleted: 'Hoàn tất',
    statusFailed: 'Thất bại',
    statusSkipped: 'Đã bỏ qua',
    statusCancelled: 'Đã hủy',
    statusPending: 'Đang chờ',
    openMsStore: 'Mở MS Store',
    skip: 'Bỏ qua',
    cancel: 'Hủy',
    terminalTitle: 'Nhật ký Winget trực tiếp',
    copy: 'Sao chép',
    clear: 'Xóa',
    terminalEmpty: 'Chờ dữ liệu stream từ winget… Toàn bộ output CLI sẽ hiển thị theo thời gian thực tại đây.',
  },
  settings: {
    wingetTitle: 'Cơ chế cài đặt Winget CLI',
    wingetSub: 'Tùy chỉnh các cờ truyền vào winget.exe khi cài mới, cập nhật và gỡ bỏ',
    save: 'Lưu cài đặt',
    saving: 'Đang lưu…',
    silentTitle: 'Chế độ Im lặng (Silent Mode)',
    silentSub: 'Tự động thêm --silent để không cần bấm Next. Tắt nếu muốn hiện cửa sổ cài đặt (--interactive).',
    agreementsTitle: 'Tự động đồng ý điều khoản',
    agreementsSub: 'Tự động truyền --accept-package-agreements và --accept-source-agreements.',
    adminTitle: 'Chạy với quyền Administrator (UAC)',
    adminSub: 'Yêu cầu hộp thoại UAC khi cài các ứng dụng hệ thống yêu cầu quyền Admin.',
    scopeTitle: 'Phạm vi cài đặt (Scope)',
    scopeSub: 'Cài cho User hiện tại hoặc toàn bộ máy (Machine).',
    scopeDefault: 'Mặc định',
    scopeUser: 'User (--scope user)',
    scopeMachine: 'Machine (--scope machine)',
    defaultSourceTitle: 'Nguồn tìm kiếm mặc định',
    defaultSourceSub: 'Áp dụng khi mở trang Kho Ứng Dụng.',
    installDirTitle: 'Thư mục cài đặt tùy chọn',
    installDirSub: 'Để trống nếu dùng đường dẫn mặc định của bộ cài (--location).',
    installDirPlaceholder: 'Ví dụ: D:\\Apps',
    appearanceTitle: 'Giao diện & Ngôn ngữ',
    appearanceSub: 'Tích hợp sẵn font Lexend offline cùng chế độ Dark / Light Mode',
    languageLabel: 'Ngôn ngữ hiển thị',
    themeModeLabel: 'Chế độ màu',
    accentLabel: 'Màu nhấn hệ thống',
    portableTitle: 'Chế độ Portable & Lưu trữ',
    portableSub: 'Tự động nhận diện portable.mode cạnh file bcrm-winget.exe',
    settingsPathLabel: 'Thư mục lưu settings.json',
    reading: 'Đang đọc…',
    openDataFolder: 'Mở thư mục dữ liệu',
    customIconHint: 'Cập nhật Icon App: Chạy lệnh npm.cmd run icon:apply <đường-dẫn-ảnh.png> để tự động tạo bộ .ico & .png.',
    wingetMissingWarn: 'Không phát hiện thấy winget.exe trên Windows. Hãy cập nhật App Installer từ Microsoft Store.',
  },
  overlays: {
    packageDetails: 'Chi tiết ứng dụng',
    closeDetails: 'Đóng chi tiết',
    versionLabel: 'Phiên bản',
    descriptionLabel: 'Mô tả ứng dụng',
    loadingDetails: 'Đang tải thông tin từ winget show…',
    noDescription: 'Chưa có mô tả chi tiết cho gói này.',
    publisherLabel: 'Nhà phát hành',
    licenseLabel: 'Giấy phép',
    installerTypeLabel: 'Định dạng bộ cài',
    homepageLabel: 'Trang chủ',
    openWebsite: 'Mở website',
    cliEquivalent: 'Lệnh Winget tương đương',
    copy: 'Copy',
    openInMsStore: 'Mở trực tiếp trên Microsoft Store',
    uninstall: 'Gỡ cài đặt',
    updateNow: 'Cập nhật ngay',
    reinstall: 'Cài lại',
    downloadInstall: 'Tải & Cài đặt',
    customizerTitle: 'Tùy chỉnh giao diện',
    themeMode: 'Chế độ màu',
    accentColor: 'Màu nhấn (Accent)',
    borderRadius: 'Bo góc (Radius)',
    radiusSharp: 'Vuông',
    radiusDefault: 'Chuẩn',
    radiusRounded: 'Bo tròn',
    density: 'Mật độ',
    densityComfortable: 'Thoáng',
    densityCompact: 'Gọn',
    motion: 'Chuyển động',
    motionSmooth: 'Mượt',
    motionOff: 'Tắt',
    language: 'Ngôn ngữ',
    cmdPlaceholder: 'Gõ tên trang, lệnh nhanh hoặc tên app…',
    cmdEmpty: 'Không tìm thấy mục phù hợp. Vào Kho Ứng Dụng để tra cứu trực tuyến.',
    cmdGroupNav: 'Điều hướng',
    cmdGroupActions: 'Thao tác nhanh',
    cmdGroupCatalog: 'Kho ứng dụng phổ biến',
    cmdToggleTheme: 'Chuyển đổi Dark Mode / Light Mode',
    cmdRescan: 'Quét lại ứng dụng đã cài trên máy',
    cmdUpgradeAll: 'Cập nhật tất cả ứng dụng có bản mới',
  },
  toasts: {
    scannedApps: (n) => `Đã quét ${n} ứng dụng trên máy`,
    scanError: (err) => `Lỗi quét app đã cài: ${err}`,
    settingsSaved: 'Đã lưu cấu hình Winget',
    enqueuedApps: (n) => `Đã đưa ${n} ứng dụng vào hàng đợi`,
    enqueueError: (err) => `Không thể thêm vào hàng đợi: ${err}`,
    copiedCmd: 'Đã sao chép lệnh winget',
    copiedLogs: 'Đã sao chép nhật ký terminal',
    clipboardError: 'Không thể truy cập clipboard',
    noSearchResults: (term, source) => `Không tìm thấy gói nào cho “${term}” trên ${source}`,
    searchError: (err) => `Lỗi tìm kiếm winget: ${err}`,
  },
  categories: {
    'Trình duyệt & Web': 'Trình duyệt & Web',
    'Lập trình & Dev Tools': 'Lập trình & Dev Tools',
    'Media & Thiết kế': 'Media & Thiết kế',
    'Văn phòng & Học tập': 'Văn phòng & Học tập',
    'Tiện ích Hệ thống': 'Tiện ích Hệ thống',
    'Gaming & Giao tiếp': 'Gaming & Giao tiếp',
    'Microsoft Store': 'Microsoft Store',
  },
};

export function getTranslations(lang: LanguageCode): Translations {
  return lang === 'vi' ? VI : EN;
}

export function translateCategory(rawCategory: string, lang: LanguageCode): string {
  const dict = getTranslations(lang).categories;
  return dict[rawCategory] ?? rawCategory;
}

const APP_SUMMARIES_EN: Record<string, string> = {
  'Google.Chrome': 'Fast, secure web browser by Google with seamless cross-device sync.',
  'Mozilla.Firefox': 'Open-source web browser focused on privacy, speed, and deep customization.',
  'Brave.Brave': 'Chromium-based browser with built-in ad and tracker blocking.',
  'TheBrowserCompany.Arc': 'Modern browser organized around Spaces and vertical sidebar tabs.',
  'Tonec.InternetDownloadManager': 'Multi-threaded download accelerator with browser video capture.',
  'Cloudflare.Warp': '1.1.1.1 client that optimizes DNS lookups and encrypts internet traffic.',
  'Tailscale.Tailscale': 'Zero-config mesh VPN built on WireGuard for private device networking.',
  'qBittorrent.qBittorrent': 'Lightweight, open-source BitTorrent client with zero ads.',
  'Microsoft.VisualStudioCode': 'Industry-standard code editor with a vast extension ecosystem.',
  'Git.Git': 'Distributed version control system with Git Bash for Windows.',
  'OpenJS.NodeJS.LTS': 'Long-term support (LTS) release of the V8 JavaScript runtime.',
  'Python.Python.3.12': 'Python programming language runtime bundled with pip package manager.',
  'Docker.DockerDesktop': 'Container runtime and isolated development environment for Windows.',
  'Microsoft.WindowsTerminal': 'GPU-accelerated tabbed terminal for PowerShell, CMD, and WSL.',
  'Microsoft.PowerShell': 'Modern, faster cross-platform PowerShell 7 automation shell.',
  'Postman.Postman': 'API platform for building, testing, and documenting REST and GraphQL APIs.',
  'GitHub.GitHubDesktop': 'Visual desktop client for committing, merging, and syncing GitHub repos.',
  'Rustlang.Rustup': 'Official toolchain installer and version manager for Rust and Cargo.',
  'VideoLAN.VLC': 'Universal media player that plays nearly every video and audio format.',
  'OBSProject.OBSStudio': 'Free, open-source software for screen recording and live streaming.',
  'Gyan.FFmpeg': 'Powerful command-line suite for converting, filtering, and compressing media.',
  'Spotify.Spotify': 'High-quality music and podcast streaming desktop application.',
  'Figma.Figma': 'Collaborative interface design and prototyping desktop app.',
  'ShareX.ShareX': 'Lightweight power tool for screenshots, GIF recording, and OCR.',
  'BlenderFoundation.Blender': 'Open-source 3D creation suite for modeling, animation, and rendering.',
  'ByteDance.CapCut': 'Fast desktop video editor with effects and automatic captions.',
  'Notion.Notion': 'All-in-one workspace for notes, docs, databases, and project tracking.',
  'Obsidian.Obsidian': 'Local-first Markdown note-taking app with a connected knowledge graph.',
  'TheDocumentFoundation.LibreOffice': 'Free open-source office suite for documents, spreadsheets, and slides.',
  'Foxit.FoxitReader': 'Fast, lightweight PDF viewer and annotation tool for everyday work.',
  'SumatraPDF.SumatraPDF': 'Ultra-lightweight instant reader for PDF, EPUB, and MOBI files.',
  'Anki.Anki': 'Spaced-repetition flashcard app for efficient studying and memorization.',
  'Zoom.Zoom': 'Video conferencing and online collaboration platform.',
  '7zip.7zip': 'High-compression file archiver supporting 7z, ZIP, RAR, and TAR.',
  'RARLab.WinRAR': 'Classic Windows archiver and extractor for RAR and ZIP files.',
  'Microsoft.PowerToys': 'Windows power-user utilities: FancyZones, Run, Color Picker, Text Extractor.',
  'voidtools.Everything': 'Instant filename search across all NTFS drives in milliseconds.',
  'Guru3D.Afterburner': 'Real-time CPU/GPU temperature monitoring, fan control, and overclocking.',
  'CPUID.CPU-Z': 'Detailed hardware diagnostics for CPU, motherboard, RAM, and cache.',
  'CrystalDewWorld.CrystalDiskInfo': 'SSD/HDD health monitor with temperature and S.M.A.R.T. metrics.',
  'AntibodySoftware.WizTree': 'Blazing-fast disk space analyzer to locate large files and folders.',
  'Bitwarden.Bitwarden': 'Open-source cross-platform password manager with end-to-end encryption.',
  'UniKey.UniKey': 'Lightweight Vietnamese keyboard input method (Telex & VNI) for Windows.',
  'Discord.Discord': 'Voice, video, and text chat platform for communities and developers.',
  'Telegram.TelegramDesktop': 'Fast cloud-synced messaging app with large file sharing.',
  'Valve.Steam': 'The leading PC gaming store, launcher, and community platform.',
  '9NKSQGP7F2NH': 'Official WhatsApp desktop client distributed via Microsoft Store.',
  '9WZDNCRFJ3TJ': 'Official Netflix streaming app for high-definition playback on Windows.',
  '9NBLGGH5L9XT': 'Per-app volume mixer directly integrated into the Windows taskbar.',
  '9NW33J738BL0': 'Modern Fluent WinUI 3 media player powered by the VLC engine.',
  '9NCBCSZSJRSB': 'Official MSIX-packaged Spotify client from Microsoft Store.',
  'XP9CDQW6ML4N4H': 'Visual Studio Code distributed and updated through Microsoft Store.',
};

export function translateAppSummary(
  id: string,
  fallback: string | null | undefined,
  lang: LanguageCode,
): string | null | undefined {
  if (lang === 'en' && APP_SUMMARIES_EN[id]) {
    return APP_SUMMARIES_EN[id];
  }
  return fallback;
}
