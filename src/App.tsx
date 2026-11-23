import React from 'react';
import { AppShell } from './components/AppShell';
import {
  CommandPalette,
  CustomizerPopover,
  PackageDrawer,
  ToastRegion,
} from './components/Overlays';
import { AppProvider, useApp } from './lib/store';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { InstalledPage } from './pages/InstalledPage';
import { QueuePage } from './pages/QueuePage';
import { SettingsPage } from './pages/SettingsPage';

const ActiveRouteView: React.FC = () => {
  const { route } = useApp();
  switch (route) {
    case 'discover':
      return <DiscoverPage />;
    case 'installed':
      return <InstalledPage />;
    case 'queue':
      return <QueuePage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell>
        <ActiveRouteView />
      </AppShell>
      <PackageDrawer />
      <CustomizerPopover />
      <CommandPalette />
      <ToastRegion />
    </AppProvider>
  );
};

export default App;
