import React from 'react';
import ReactDOM from 'react-dom/client';
import { getCurrentWindow } from '@tauri-apps/api/window';
import '@fontsource/lexend/300.css';
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/500.css';
import '@fontsource/lexend/600.css';
import '@fontsource/lexend/700.css';
import './styles/tokens.css';
import './styles/styles.css';
import './styles/animations.css';
import App from './App';
import { isTauriRuntime } from './lib/tauri';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Reveal the native desktop window only after CSS + first React paint are committed
if (isTauriRuntime()) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const win = getCurrentWindow();
      void win.show().then(() => win.setFocus()).catch(() => {});
    });
  });
}
