import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Info,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { AppIcon } from '../components/AppIcon';
import type { InstalledRecord } from '../types';

type SortKey = 'name' | 'id' | 'version' | 'source';
type TabMode = 'all' | 'updates';

function makeRowKey(rec: InstalledRecord): string {
  return `${rec.id}::${rec.version}::${rec.source}`;
}

export const InstalledPage: React.FC = () => {
  const {
    installed,
    isLoadingInstalled,
    refreshInstalled,
    enqueuePackages,
    openPackageDrawer,
    t,
  } = useApp();

  const [tab, setTab] = useState<TabMode>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'winget' | 'msstore'>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Record<string, InstalledRecord>>({});

  const updatableCount = useMemo(
    () => installed.filter((r) => Boolean(r.availableVersion)).length,
    [installed],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = installed.filter((item) => {
      if (tab === 'updates' && !item.availableVersion) return false;
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const av = (a[sortKey] ?? '').toLowerCase();
      const bv = (b[sortKey] ?? '').toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [installed, tab, sourceFilter, search, sortKey, sortAsc]);

  const selectedList = useMemo(() => Object.values(selectedRows), [selectedRows]);
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => Boolean(selectedRows[makeRowKey(r)]));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const next = { ...selectedRows };
      for (const r of filtered) delete next[makeRowKey(r)];
      setSelectedRows(next);
    } else {
      const next = { ...selectedRows };
      for (const r of filtered) next[makeRowKey(r)] = r;
      setSelectedRows(next);
    }
  };

  const toggleRow = (rec: InstalledRecord) => {
    const key = makeRowKey(rec);
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = rec;
      return next;
    });
  };

  const handleBulkUpgrade = () => {
    const targets = selectedList.filter((r) => Boolean(r.availableVersion));
    const listToUpgrade = targets.length > 0 ? targets : selectedList;
    if (listToUpgrade.length === 0) return;
    enqueuePackages(
      listToUpgrade.map((r) => ({
        id: r.id,
        name: r.name,
        source: r.source,
        operation: 'upgrade',
      })),
      true,
    );
    setSelectedRows({});
  };

  const handleBulkUninstall = () => {
    if (selectedList.length === 0) return;
    enqueuePackages(
      selectedList.map((r) => ({
        id: r.id,
        name: r.name,
        source: r.source,
        operation: 'uninstall',
      })),
      true,
    );
    setSelectedRows({});
  };

  const handleUpdateAll = () => {
    const targets = installed.filter((r) => Boolean(r.availableVersion));
    if (targets.length === 0) return;
    enqueuePackages(
      targets.map((r) => ({
        id: r.id,
        name: r.name,
        source: r.source,
        operation: 'upgrade',
      })),
      true,
    );
  };

  return (
    <div className="anim-enter">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="pill-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              className={`pill-tab ${tab === 'all' ? 'active' : ''}`}
              onClick={() => setTab('all')}
            >
              {t.installed.allInstalled(installed.length)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'updates'}
              className={`pill-tab ${tab === 'updates' ? 'active' : ''}`}
              onClick={() => setTab('updates')}
            >
              {t.installed.updatesTab(updatableCount)}
            </button>
          </div>

          <div className="search-field" style={{ minWidth: 230 }}>
            <span className="search-field-icon" aria-hidden="true">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="input"
              placeholder={t.installed.filterPlaceholder}
              aria-label={t.installed.filterPlaceholder}
              spellCheck={false}
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <select
            className="select-pill"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'all' | 'winget' | 'msstore')}
            aria-label={t.installed.colSource}
          >
            <option value="all">{t.installed.allSources}</option>
            <option value="winget">{t.installed.wingetOnly}</option>
            <option value="msstore">{t.installed.msstoreOnly}</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => refreshInstalled(false)}
            disabled={isLoadingInstalled}
          >
            <RefreshCw size={13} className={isLoadingInstalled ? 'spin' : undefined} aria-hidden="true" />
            <span>{t.installed.rescan}</span>
          </button>

          {updatableCount > 0 && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleUpdateAll}>
              <UploadCloud size={13} aria-hidden="true" />
              <span>{t.installed.updateAll(updatableCount)}</span>
            </button>
          )}
        </div>
      </div>

      {selectedList.length > 0 && (
        <div className="bulk-bar anim-zoom">
          <span className="tabular" style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
            {t.installed.selectedCount(selectedList.length)}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedRows({})}>
              {t.installed.clearSelection}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleBulkUpgrade}>
              <UploadCloud size={13} aria-hidden="true" />
              <span>{t.installed.updateSelected}</span>
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleBulkUninstall}>
              <Trash2 size={13} aria-hidden="true" />
              <span>{t.installed.uninstallSelected(selectedList.length)}</span>
            </button>
          </div>
        </div>
      )}

      <div className="card table-card">
        <div className="table-scroll">
          <table className="data-table">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '176px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ width: 42 }}>
                  <input
                    type="checkbox"
                    className="pkg-checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label={t.installed.colName}
                  />
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('name')}>
                    <span>{t.installed.colName}</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('id')}>
                    <span>{t.installed.colId}</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('version')}>
                    <span>{t.installed.colCurrent}</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th>{t.installed.colAvailable}</th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('source')}>
                    <span>{t.installed.colSource}</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>{t.installed.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    {isLoadingInstalled ? t.installed.scanningTable : t.installed.emptyTable}
                  </td>
                </tr>
              ) : (
                filtered.map((rec, idx) => {
                  const rKey = makeRowKey(rec);
                  return (
                    <tr key={`${rKey}::${idx}`}>
                      <td>
                        <input
                          type="checkbox"
                          className="pkg-checkbox"
                          checked={Boolean(selectedRows[rKey])}
                          onChange={() => toggleRow(rec)}
                          aria-label={rec.name}
                        />
                      </td>
                      <td>
                        <div className="pkg-cell-name-wrap">
                          <AppIcon id={rec.id} name={rec.name} size={26} />
                          <span className="pkg-cell-name" title={rec.name}>
                            {rec.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="mono pkg-cell-id" title={rec.id}>
                          {rec.id}
                        </span>
                      </td>
                      <td>
                        <span className="tabular">{rec.version}</span>
                      </td>
                      <td>
                        {rec.availableVersion ? (
                          <span className="badge badge-warning tabular">{rec.availableVersion}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{t.installed.latest}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge mono ${rec.source === 'msstore' ? 'badge-info' : ''}`}>
                          {rec.source}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title={t.installed.viewDetails}
                            aria-label={`${t.installed.viewDetails} ${rec.name}`}
                            onClick={() =>
                              openPackageDrawer({
                                id: rec.id,
                                name: rec.name,
                                version: rec.version,
                                availableVersion: rec.availableVersion,
                                source: rec.source,
                                isInstalled: true,
                                hasUpdate: Boolean(rec.availableVersion),
                                tags: [],
                                storeUrl:
                                  rec.source === 'msstore'
                                    ? `ms-windows-store://pdp/?ProductId=${rec.id}`
                                    : null,
                              })
                            }
                          >
                            <Info size={13} aria-hidden="true" />
                          </button>
                          {rec.availableVersion && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                enqueuePackages([
                                  {
                                    id: rec.id,
                                    name: rec.name,
                                    source: rec.source,
                                    operation: 'upgrade',
                                  },
                                ])
                              }
                            >
                              {t.installed.update}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              enqueuePackages([
                                {
                                  id: rec.id,
                                  name: rec.name,
                                  source: rec.source,
                                  operation: 'uninstall',
                                },
                              ])
                            }
                          >
                            {t.installed.uninstall}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
