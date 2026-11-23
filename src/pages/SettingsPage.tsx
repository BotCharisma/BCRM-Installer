import React, { useEffect, useState } from 'react';
import { FolderOpen, Globe, Image, Monitor, Moon, Save, ShieldAlert, Sun } from 'lucide-react';
import { invoke } from '../lib/tauri';
import { useApp } from '../lib/store';
import type { AccentPreset, AppSettings, LanguageCode, ThemeMode } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, saveSettings, prefs, updatePrefs, envInfo, pushToast, t } = useApp();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(draft);
    } finally {
      setSaving(false);
    }
  };

  const openDataFolder = async () => {
    try {
      await invoke('open_data_dir');
    } catch (err) {
      pushToast(String(err), 'negative');
    }
  };

  return (
    <div className="settings-grid anim-enter">
      {/* Column 1: Winget Execution Flags */}
      <div className="card">
        <div className="card-head" style={{ marginBottom: 8 }}>
          <div>
            <h2 className="card-title">{t.settings.wingetTitle}</h2>
            <p className="card-sub">{t.settings.wingetSub}</p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={13} aria-hidden="true" />
            <span>{saving ? t.settings.saving : t.settings.save}</span>
          </button>
        </div>

        <div className="setting-row">
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{t.settings.silentTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t.settings.silentSub}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={t.settings.silentTitle}
            aria-checked={draft.silentMode}
            className="switch"
            onClick={() => setDraft((d) => ({ ...d, silentMode: !d.silentMode }))}
          />
        </div>

        <div className="setting-row">
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{t.settings.agreementsTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t.settings.agreementsSub}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={t.settings.agreementsTitle}
            aria-checked={draft.acceptAgreements}
            className="switch"
            onClick={() => setDraft((d) => ({ ...d, acceptAgreements: !d.acceptAgreements }))}
          />
        </div>

        <div className="setting-row">
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{t.settings.adminTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t.settings.adminSub}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={t.settings.adminTitle}
            aria-checked={draft.runAsAdmin}
            className="switch"
            onClick={() => setDraft((d) => ({ ...d, runAsAdmin: !d.runAsAdmin }))}
          />
        </div>

        <div className="setting-row">
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{t.settings.scopeTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t.settings.scopeSub}
            </div>
          </div>
          <select
            className="select-pill"
            aria-label={t.settings.scopeTitle}
            value={draft.scope}
            onChange={(e) =>
              setDraft((d) => ({ ...d, scope: e.target.value as AppSettings['scope'] }))
            }
          >
            <option value="default">{t.settings.scopeDefault}</option>
            <option value="user">{t.settings.scopeUser}</option>
            <option value="machine">{t.settings.scopeMachine}</option>
          </select>
        </div>

        <div className="setting-row">
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{t.settings.defaultSourceTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t.settings.defaultSourceSub}
            </div>
          </div>
          <select
            className="select-pill"
            aria-label={t.settings.defaultSourceTitle}
            value={draft.defaultSource}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                defaultSource: e.target.value as AppSettings['defaultSource'],
              }))
            }
          >
            <option value="all">{t.discover.sourceAll}</option>
            <option value="winget">{t.discover.sourceWinget}</option>
            <option value="msstore">{t.discover.sourceMsstore}</option>
          </select>
        </div>

        <div className="setting-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{t.settings.installDirTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              {t.settings.installDirSub}
            </div>
            <input
              type="text"
              className="input"
              aria-label={t.settings.installDirTitle}
              placeholder={t.settings.installDirPlaceholder}
              spellCheck={false}
              autoComplete="off"
              value={draft.customInstallDir}
              onChange={(e) => setDraft((d) => ({ ...d, customInstallDir: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Column 2: Language, Appearance & Portable Packaging */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 14 }}>
            <div>
              <h2 className="card-title">{t.settings.appearanceTitle}</h2>
              <p className="card-sub">{t.settings.appearanceSub}</p>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Globe size={13} aria-hidden="true" />
              <span>{t.settings.languageLabel}</span>
            </div>
            <div className="seg-options seg-cols-2">
              {(
                [
                  { id: 'en', label: 'English (Default)' },
                  { id: 'vi', label: 'Tiếng Việt' },
                ] as Array<{ id: LanguageCode; label: string }>
              ).map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`seg-option ${prefs.language === lang.id ? 'active' : ''}`}
                  onClick={() => updatePrefs({ language: lang.id })}
                >
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              {t.settings.themeModeLabel}
            </div>
            <div className="seg-options seg-cols-3">
              {(
                [
                  { id: 'dark', label: 'Dark', icon: <Moon size={13} aria-hidden="true" /> },
                  { id: 'light', label: 'Light', icon: <Sun size={13} aria-hidden="true" /> },
                  { id: 'system', label: 'System', icon: <Monitor size={13} aria-hidden="true" /> },
                ] as Array<{ id: ThemeMode; label: string; icon: React.ReactNode }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`seg-option ${prefs.theme === m.id ? 'active' : ''}`}
                  onClick={() => updatePrefs({ theme: m.id })}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              {t.settings.accentLabel}
            </div>
            <div className="seg-options seg-cols-2">
              {(
                [
                  { id: 'monochrome', label: 'Mono', color: '#a1a1aa' },
                  { id: 'emerald', label: 'Emerald', color: '#10b981' },
                  { id: 'blue', label: 'Blue', color: '#3b82f6' },
                  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
                ] as Array<{ id: AccentPreset; label: string; color: string }>
              ).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`seg-option ${prefs.accent === a.id ? 'active' : ''}`}
                  onClick={() => updatePrefs({ accent: a.id })}
                >
                  <span className="swatch-dot" style={{ background: a.color }} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="card-title">{t.settings.portableTitle}</h2>
              <p className="card-sub">{t.settings.portableSub}</p>
            </div>
            <span className={`badge ${envInfo?.isPortable ? 'badge-info' : 'badge-positive'}`}>
              {envInfo?.isPortable ? 'Portable Mode' : 'Installed Mode'}
            </span>
          </div>

          <div
            className="subcard"
            style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t.settings.settingsPathLabel}
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
              {envInfo?.dataDir ?? t.settings.reading}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={openDataFolder}>
              <FolderOpen size={13} aria-hidden="true" />
              <span>{t.settings.openDataFolder}</span>
            </button>
          </div>

          <div className="subcard" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Image
              size={16}
              style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}
              aria-hidden="true"
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {t.settings.customIconHint}
            </div>
          </div>

          {!envInfo?.wingetAvailable && (
            <div
              className="subcard"
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 10,
                borderColor: 'var(--negative)',
              }}
            >
              <ShieldAlert size={16} style={{ color: 'var(--negative)', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ fontSize: '0.78rem' }}>{t.settings.wingetMissingWarn}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
