import { useState, useEffect, useCallback } from 'react';
import type { Person, StatsResponse } from './api/client';
import { listPeople, deletePerson, getStats } from './api/client';
import PersonTable from './components/PersonTable';
import TrendPanel from './components/TrendPanel';
import PersonDetailModal from './components/PersonDetailModal';

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeoplePage = useCallback(
    async (cursor?: string, currentLimit = limit) => {
      setLoading(true);
      setError(null);
      try {
        const page = await listPeople(cursor, currentLimit);
        setPeople(page.people);
        setNextCursor(page.next);
      } catch (err: any) {
        setError(err.message || 'Failed to load people');
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  const fetchStatsData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPeoplePage(undefined, limit);
    fetchStatsData();
  }, [fetchPeoplePage, fetchStatsData, limit]);

  // Handle Deletion
  const handleDelete = async (id: string) => {
    try {
      await deletePerson(id);

      // Optimistically / immediately remove from local table state
      setPeople((prev) => prev.filter((p) => p.id !== id));

      // Close modal if deleted person was selected
      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }

      // Refresh aggregate trends to keep stats consistent
      fetchStatsData();
    } catch (err: any) {
      alert(`Error deleting person: ${err.message}`);
    }
  };

  // Next page (keyset cursor)
  const handleNextPage = () => {
    if (!nextCursor) return;
    const nextIdx = pageIndex + 1;
    setPageIndex(nextIdx);

    // Save current nextCursor for the upcoming page
    setCursorHistory((prev) => {
      const updated = [...prev];
      updated[nextIdx] = nextCursor;
      return updated;
    });

    fetchPeoplePage(nextCursor, limit);
  };

  // Previous page
  const handlePrevPage = () => {
    if (pageIndex <= 0) return;
    const prevIdx = pageIndex - 1;
    setPageIndex(prevIdx);
    const prevCursor = cursorHistory[prevIdx];
    fetchPeoplePage(prevCursor, limit);
  };

  // Reset to first page
  const handleResetToFirst = () => {
    setPageIndex(0);
    setCursorHistory([undefined]);
    fetchPeoplePage(undefined, limit);
  };

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              fetchPeoplePage(cursorHistory[pageIndex], limit);
              fetchStatsData();
            }}
            title="Refresh directory and trends"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Aggregate Trends View */}
      <TrendPanel stats={stats} loading={statsLoading} />

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
          <button className="btn btn-secondary btn-sm" onClick={() => fetchPeoplePage(cursorHistory[pageIndex], limit)}>
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
              Page {pageIndex + 1} • Keyset paginated • Click any row to inspect full details
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
