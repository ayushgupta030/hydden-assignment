import { useState, useEffect, useCallback } from 'react';
import type { Person, StatsResponse, FilterOptions } from './api/client';
import { listPeople, deletePerson, getStats, produce } from './api/client';
import PersonTable from './components/PersonTable';
import TrendPanel from './components/TrendPanel';
import PersonDetailModal from './components/PersonDetailModal';
import FilterBar from './components/FilterBar';

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);

  const [filters, setFilters] = useState<FilterOptions>({});
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [producing, setProducing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPeoplePage = useCallback(
    async (cursor?: string, currentLimit = limit, currentFilters = filters) => {
      setLoading(true);
      setError(null);
      try {
        const page = await listPeople(cursor, currentLimit, currentFilters);
        setPeople(page.people);
        setNextCursor(page.next);
      } catch (err: any) {
        setError(err.message || 'Failed to load people');
      } finally {
        setLoading(false);
      }
    },
    [limit, filters]
  );

  const fetchStatsData = useCallback(
    async (currentFilters = filters) => {
      setStatsLoading(true);
      try {
        const data = await getStats(currentFilters);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setStatsLoading(false);
      }
    },
    [filters]
  );

  // Initial load and whenever limit or filters change
  useEffect(() => {
    fetchPeoplePage(undefined, limit, filters);
    fetchStatsData(filters);
  }, [fetchPeoplePage, fetchStatsData, limit, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPageIndex(0);
    setCursorHistory([undefined]);
  };

  // Handle Deletion
  const handleDelete = async (id: string) => {
    try {
      await deletePerson(id);

      // Optimistically remove from local table state
      setPeople((prev) => prev.filter((p) => p.id !== id));

      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }

      // Refresh aggregate trends to keep stats consistent
      fetchStatsData(filters);
    } catch (err: any) {
      alert(`Error deleting person: ${err.message}`);
    }
  };

  // Trigger further production run (Bonus feature)
  const handleProduce = async (count: number) => {
    setProducing(true);
    try {
      const res = await produce(count);
      setToastMessage(`Successfully generated ${res.generated.toLocaleString()} new people!`);
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh data
      fetchPeoplePage(cursorHistory[pageIndex], limit, filters);
      fetchStatsData(filters);
    } catch (err: any) {
      alert(`Error producing people: ${err.message}`);
    } finally {
      setProducing(false);
    }
  };

  // Next page (keyset cursor)
  const handleNextPage = () => {
    if (!nextCursor) return;
    const nextIdx = pageIndex + 1;
    setPageIndex(nextIdx);

    setCursorHistory((prev) => {
      const updated = [...prev];
      updated[nextIdx] = nextCursor;
      return updated;
    });

    fetchPeoplePage(nextCursor, limit, filters);
  };

  // Previous page
  const handlePrevPage = () => {
    if (pageIndex <= 0) return;
    const prevIdx = pageIndex - 1;
    setPageIndex(prevIdx);
    const prevCursor = cursorHistory[prevIdx];
    fetchPeoplePage(prevCursor, limit, filters);
  };

  // Reset to first page
  const handleResetToFirst = () => {
    setPageIndex(0);
    setCursorHistory([undefined]);
    fetchPeoplePage(undefined, limit, filters);
  };

  const totalPopulation = stats?._total?.count ?? 0;

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="header">
        <div>
          <h1 className="header-title">
            <span>👥</span> Population Directory
          </h1>
          <p className="header-subtitle">
            Explore demographics, monitor trends across the population, and inspect or prune records.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Production run button with options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleProduce(1000)}
              disabled={producing}
              title="Add 1,000 new people via concurrent producers"
            >
              {producing ? (
                <>
                  <div className="loading-spinner" style={{ width: '0.9rem', height: '0.9rem', borderColor: '#ffffff', borderTopColor: 'transparent' }} />
                  Producing...
                </>
              ) : (
                <>+ Produce 1,000</>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleProduce(5000)}
              disabled={producing}
              title="Add 5,000 new people via concurrent producers"
            >
              + 5,000
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              fetchPeoplePage(cursorHistory[pageIndex], limit, filters);
              fetchStatsData(filters);
            }}
            title="Refresh directory and trends"
          >
            ↻
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--success-light)',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontWeight: 500,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✅</span> {toastMessage}
        </div>
      )}

      {/* Aggregate Trends View */}
      <TrendPanel stats={stats} loading={statsLoading} />

      {/* Database-side Filter Bar */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      {/* Error alert */}
      {error && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchPeoplePage(cursorHistory[pageIndex], limit, filters)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main People Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">People Records</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {pageIndex + 1} • Keyset paginated • Total database matches: {totalPopulation.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Rows per page:
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setLimit(newLimit);
                  setPageIndex(0);
                  setCursorHistory([undefined]);
                }}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontFamily: 'inherit',
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner" />
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Fetching people records...
              </p>
            </div>
          ) : (
            <PersonTable
              people={people}
              onDelete={handleDelete}
              onSelectPerson={(person) => setSelectedPerson(person)}
            />
          )}
        </div>

        {/* Keyset Pagination Bar */}
        <div className="pagination-container">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {people.length} record{people.length === 1 ? '' : 's'} on this page
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetToFirst}
              disabled={pageIndex === 0 || loading}
              title="Return to first page"
            >
              First Page
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrevPage}
              disabled={pageIndex === 0 || loading}
            >
              ← Previous
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleNextPage}
              disabled={!nextCursor || loading}
            >
              Next Page →
            </button>
          </div>
        </div>
      </div>

      {/* Person Detail Modal */}
      <PersonDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
