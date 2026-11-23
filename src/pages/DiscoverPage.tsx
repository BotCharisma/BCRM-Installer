import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Info,
  Loader2,
  Search,
  Store,
  UploadCloud,
  X,
} from 'lucide-react';
import { invoke } from '../lib/tauri';
import { useApp } from '../lib/store';
import { translateAppSummary, translateCategory } from '../lib/i18n';
import { AppIcon } from '../components/AppIcon';
import type { PackageItem } from '../types';

type SourceFilter = 'all' | 'winget' | 'msstore';

const CAT_POPULAR = '__popular__';
const CAT_ALL = '__all__';

export const DiscoverPage: React.FC = () => {
  const {
    catalog,
    installed,
    cart,
    toggleCart,
    clearCart,
    enqueuePackages,
    openPackageDrawer,
    settings,
    pushToast,
    language,
    t,
  } = useApp();

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(settings.defaultSource || 'all');
  const [activeCategory, setActiveCategory] = useState<string>(CAT_POPULAR);
  const [searchResults, setSearchResults] = useState<PackageItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchedTerm, setLastSearchedTerm] = useState('');

  const searchSeqRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  const sourceLabel = useCallback(
    (src: SourceFilter) => {
      if (src === 'winget') return t.discover.sourceWinget;
      if (src === 'msstore') return t.discover.sourceMsstore;
      return t.discover.sourceAll;
    },
    [t],
  );

  const categories = useMemo(() => {
    const set = new Set<string>([CAT_POPULAR, CAT_ALL]);
    for (const c of catalog) {
      set.add(c.category);
    }
    return Array.from(set);
  }, [catalog]);

  const installedLookup = useMemo(() => {
    const map = new Map<string, { version: string; availableVersion?: string | null }>();
    for (const rec of installed) {
      map.set(rec.id.toLowerCase(), {
        version: rec.version,
        availableVersion: rec.availableVersion,
      });
    }
    return map;
  }, [installed]);

  const executeLiveSearch = useCallback(
    async (term: string, source: SourceFilter, notifyEmpty = false) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setSearchResults(null);
        setLastSearchedTerm('');
        setIsSearching(false);
        return;
      }

      const seq = ++searchSeqRef.current;
      setIsSearching(true);
      setLastSearchedTerm(trimmed);

      try {
        const rows = await invoke<PackageItem[]>('search_packages', {
          query: trimmed,
          source,
        });
        if (seq !== searchSeqRef.current) return;
        setSearchResults(rows);
        if (notifyEmpty && rows.length === 0) {
          pushToast(t.toasts.noSearchResults(trimmed, sourceLabel(source)), 'info');
        }
      } catch (err) {
        if (seq !== searchSeqRef.current) return;
        pushToast(t.toasts.searchError(String(err)), 'negative');
      } finally {
        if (seq === searchSeqRef.current) {
          setIsSearching(false);
        }
      }
    },
    [pushToast, sourceLabel, t],
  );

  // Automatic debounced live search across all selected sources as the user types
  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      searchSeqRef.current += 1;
      setSearchResults(null);
      setLastSearchedTerm('');
      setIsSearching(false);
      return;
    }

    if (trimmed.length < 2) {
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void executeLiveSearch(trimmed, sourceFilter, false);
    }, 450);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [query, sourceFilter, executeLiveSearch]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    void executeLiveSearch(query, sourceFilter, true);
  };

  const displayedPackages: PackageItem[] = useMemo(() => {
    if (searchResults !== null) {
      return searchResults
        .filter((p) => sourceFilter === 'all' || p.source === sourceFilter)
        .map((p) => {
          const inst = installedLookup.get(p.id.toLowerCase());
          return {
            ...p,
            isInstalled: Boolean(inst) || p.isInstalled,
            availableVersion: inst?.availableVersion ?? p.availableVersion,
            hasUpdate: Boolean(inst?.availableVersion) || p.hasUpdate,
          };
        });
    }

    const q = query.trim().toLowerCase();
    return catalog
      .filter((c) => {
        if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
        if (activeCategory === CAT_POPULAR && !c.popular && !q) return false;
        if (
          activeCategory !== CAT_POPULAR &&
          activeCategory !== CAT_ALL &&
          c.category !== activeCategory
        ) {
          return false;
        }
        if (
          q &&
          !c.name.toLowerCase().includes(q) &&
          !c.id.toLowerCase().includes(q) &&
          !c.summary.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .map((c) => {
        const inst = installedLookup.get(c.id.toLowerCase());
        return {
          id: c.id,
          name: c.name,
          version: inst?.version ?? c.installedVersion ?? 'Latest',
          availableVersion: inst?.availableVersion ?? c.availableVersion,
          source: c.source,
          isInstalled: Boolean(inst) || c.isInstalled,
          hasUpdate: Boolean(inst?.availableVersion) || c.hasUpdate,
          category: c.category,
          summary: c.summary,
          publisher: c.publisher,
          tags: c.tags,
          storeUrl: c.storeUrl,
        };
      });
  }, [searchResults, sourceFilter, query, catalog, activeCategory, installedLookup]);

  const cartList = useMemo(() => Object.values(cart), [cart]);

  const handleInstallCart = async () => {
    if (cartList.length === 0) return;
    await enqueuePackages(
      cartList.map((c) => ({
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
    <div className="anim-enter">
      {/* Live Auto-Search & Source Filter Bar */}
      <form className="toolbar" onSubmit={handleManualSubmit}>
        <div className="toolbar-left" style={{ flex: 1 }}>
          <div className="search-field">
            <span className="search-field-icon" aria-hidden="true">
              {isSearching ? <Loader2 size={15} className="spin" /> : <Search size={15} strokeWidth={1.75} />}
            </span>
            <input
              type="text"
              className="input"
              placeholder={t.discover.searchPlaceholder}
              aria-label={t.discover.searchPlaceholder}
              spellCheck={false}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (!v.trim()) {
                  setSearchResults(null);
                  setLastSearchedTerm('');
                }
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <Loader2 size={14} className="spin" aria-hidden="true" />
            ) : (
              <Search size={14} aria-hidden="true" />
            )}
            <span>{isSearching ? t.discover.searching : t.discover.searchOnline}</span>
          </button>

          {(searchResults !== null || query.trim().length > 0) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                searchSeqRef.current += 1;
                setQuery('');
                setSearchResults(null);
                setLastSearchedTerm('');
                setIsSearching(false);
              }}
            >
              <X size={14} aria-hidden="true" />
              <span>{t.discover.backToCatalog}</span>
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <div className="pill-group" role="tablist" aria-label={t.discover.sourceAll}>
            {(
              [
                { id: 'all', label: t.discover.sourceAll },
                { id: 'winget', label: t.discover.sourceWinget },
                { id: 'msstore', label: t.discover.sourceMsstore },
              ] as const
            ).map((src) => (
              <button
                key={src.id}
                type="button"
                role="tab"
                aria-selected={sourceFilter === src.id}
                className={`pill-tab ${sourceFilter === src.id ? 'active' : ''}`}
                onClick={() => setSourceFilter(src.id)}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Auto-searching banner */}
      {isSearching && query.trim().length >= 2 && (
        <div
          className="subcard"
          style={{
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-secondary)',
          }}
          role="status"
          aria-live="polite"
        >
          <Loader2 size={15} className="spin" aria-hidden="true" />
          <span>{t.discover.searchingBanner(query.trim(), sourceLabel(sourceFilter))}</span>
        </div>
      )}

      {/* Fast-Pick Category Tabs when browsing Curated Catalog */}
      {searchResults === null ? (
        <div className="category-tabs">
          <div className="pill-group">
            {categories.map((cat) => {
              const label =
                cat === CAT_POPULAR
                  ? t.discover.catPopular
                  : cat === CAT_ALL
                    ? t.discover.catAll
                    : translateCategory(cat, language);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`pill-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="subcard"
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>{t.discover.liveResultsFor(sourceLabel(sourceFilter), lastSearchedTerm)}</span>
          <span className="badge tabular">{t.discover.packagesCount(displayedPackages.length)}</span>
        </div>
      )}

      {/* Package Cards Grid */}
      {displayedPackages.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '42px 20px' }}>
          {isSearching ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
              <Loader2 size={16} className="spin" aria-hidden="true" />
              <span>{t.discover.searchingBanner(query.trim(), sourceLabel(sourceFilter))}</span>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 6 }}>
                {t.discover.emptyTitle}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 16 }}>
                {t.discover.emptySub}
              </div>
              {query.trim() && (
                <button type="button" className="btn btn-primary" onClick={() => handleManualSubmit()}>
                  <Search size={14} aria-hidden="true" />
                  <span>{t.discover.searchNowFor(query.trim(), sourceLabel(sourceFilter))}</span>
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="pkg-grid">
          {displayedPackages.map((pkg, idx) => {
            const checked = Boolean(cart[pkg.id]);
            const resolvedSummary =
              translateAppSummary(pkg.id, pkg.summary, language) ??
              t.discover.defaultSummary(pkg.source);
            return (
              <article
                key={`${pkg.source}-${pkg.id}-${idx}`}
                className={`pkg-card ${checked ? 'is-selected' : ''}`}
              >
                <div className="pkg-card-head">
                  <div className="pkg-title-wrap">
                    <AppIcon id={pkg.id} name={pkg.name} size={40} />
                    <div className="pkg-title-stack">
                      <h3 className="pkg-name" title={pkg.name}>
                        {pkg.name}
                      </h3>
                      <div className="pkg-id" title={pkg.id}>
                        {pkg.id}
                      </div>
                    </div>
                  </div>
                  <div className="pkg-card-head-right">
                    <span
                      className={`badge mono ${pkg.source === 'msstore' ? 'badge-info' : ''}`}
                      title={pkg.source === 'msstore' ? 'Microsoft Store' : 'Winget Repository'}
                    >
                      {pkg.source === 'msstore' && <Store size={11} aria-hidden="true" />}
                      {pkg.source}
                    </span>
                    <button
                      type="button"
                      className={`pkg-select-btn ${checked ? 'is-checked' : ''}`}
                      aria-pressed={checked}
                      aria-label={pkg.name}
                      title={checked ? t.discover.clearSelection : pkg.name}
                      onClick={() =>
                        toggleCart({ id: pkg.id, name: pkg.name, source: pkg.source })
                      }
                    >
                      {checked && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <p className="pkg-summary">{resolvedSummary}</p>

                <div className="pkg-meta-row">
                  <span className="badge tabular">
                    {pkg.isInstalled ? `v${pkg.version}` : pkg.version}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {pkg.isInstalled && (
                      <span className="badge badge-positive">
                        <Check size={11} aria-hidden="true" /> {t.discover.installed}
                      </span>
                    )}
                    {pkg.hasUpdate && pkg.availableVersion && (
                      <span className="badge badge-warning">
                        {t.discover.newVersion(pkg.availableVersion)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pkg-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openPackageDrawer(pkg)}
                  >
                    <Info size={13} aria-hidden="true" />
                    <span>{t.discover.details}</span>
                  </button>

                  {pkg.hasUpdate ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        enqueuePackages([
                          {
                            id: pkg.id,
                            name: pkg.name,
                            source: pkg.source,
                            operation: 'upgrade',
                          },
                        ])
                      }
                    >
                      <UploadCloud size={13} aria-hidden="true" />
                      <span>{t.discover.update}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        enqueuePackages([
                          {
                            id: pkg.id,
                            name: pkg.name,
                            source: pkg.source,
                            operation: 'install',
                          },
                        ])
                      }
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>
                        {pkg.isInstalled ? t.discover.reinstall : t.discover.downloadInstall}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating Multi-select Batch Install Bar */}
      {cartList.length > 0 && (
        <div className="cart-floating-bar anim-zoom">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong className="tabular" style={{ fontSize: '0.8125rem' }}>
              {t.discover.selectedApps(cartList.length)}
            </strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t.discover.sequentialMode(settings.silentMode)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearCart}>
              {t.discover.clearSelection}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleInstallCart}>
              <Download size={13} aria-hidden="true" />
              <span>{t.discover.installSelected(cartList.length)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
