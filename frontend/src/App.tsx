import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Group,
  Title,
  Text,
  Button,
  Card,
  Select,
  Alert,
  Loader,
  Center,
  ThemeIcon,
  Stack,
} from '@mantine/core';
import {
  IconUsers,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
} from '@tabler/icons-react';

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

      setPeople((prev) => prev.filter((p) => p.id !== id));

      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }

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
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Group gap="xs">
            <ThemeIcon size={34} radius="md" color="blue" variant="filled">
              <IconUsers size={20} />
            </ThemeIcon>
            <Title order={1} size="h2">
              Population Directory
            </Title>
          </Group>
          <Text c="dimmed" size="sm" mt={4}>
            Explore demographics, monitor trends across the population, and inspect or prune records.
          </Text>
        </div>

        <Group gap="xs">
          <Button.Group>
            <Button
              color="blue"
              onClick={() => handleProduce(1000)}
              loading={producing}
              leftSection={<IconPlus size={16} />}
            >
              + 1,000
            </Button>
            <Button
              color="blue"
              variant="light"
              onClick={() => handleProduce(5000)}
              disabled={producing}
            >
              + 5,000
            </Button>
          </Button.Group>

          <Button
            variant="default"
            onClick={() => {
              fetchPeoplePage(cursorHistory[pageIndex], limit, filters);
              fetchStatsData(filters);
            }}
            title="Refresh"
            leftSection={<IconRefresh size={16} />}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Toast Notification */}
      {toastMessage && (
        <Alert
          color="teal"
          title="Production Run Completed"
          icon={<IconCheck size={18} />}
          withCloseButton
          onClose={() => setToastMessage(null)}
          mb="md"
        >
          {toastMessage}
        </Alert>
      )}

      {/* Error Notification */}
      {error && (
        <Alert
          color="red"
          title="Error Loading Data"
          icon={<IconAlertCircle size={18} />}
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          <Group justify="space-between">
            <Text size="sm">{error}</Text>
            <Button
              size="xs"
              color="red"
              variant="outline"
              onClick={() => fetchPeoplePage(cursorHistory[pageIndex], limit, filters)}
            >
              Retry
            </Button>
          </Group>
        </Alert>
      )}

      {/* Aggregate Trends Panel */}
      <TrendPanel stats={stats} loading={statsLoading} />

      {/* Database Filters */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      {/* People Table Card */}
      <Card withBorder shadow="sm" radius="md">
        <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <div>
            <Text fw={700} size="md">
              People Records
            </Text>
            <Text size="xs" c="dimmed">
              Page {pageIndex + 1} • Keyset paginated • Total database matches: {totalPopulation.toLocaleString()}
            </Text>
          </div>

          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Rows:
            </Text>
            <Select
              size="xs"
              value={String(limit)}
              onChange={(val) => {
                if (val) {
                  const newLimit = Number(val);
                  setLimit(newLimit);
                  setPageIndex(0);
                  setCursorHistory([undefined]);
                }
              }}
              data={[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              style={{ width: 80 }}
            />
          </Group>
        </Group>

        {loading ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <Loader size="md" color="blue" />
              <Text size="sm" c="dimmed">
                Fetching people records from database...
              </Text>
            </Stack>
          </Center>
        ) : (
          <PersonTable
            people={people}
            onDelete={handleDelete}
            onSelectPerson={(person) => setSelectedPerson(person)}
          />
        )}

        {/* Keyset Pagination Bar */}
        <Group justify="space-between" p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Text size="xs" c="dimmed">
            Showing {people.length} record{people.length === 1 ? '' : 's'} on this page
          </Text>

          <Group gap="xs">
            <Button
              variant="default"
              size="xs"
              onClick={handleResetToFirst}
              disabled={pageIndex === 0 || loading}
              leftSection={<IconChevronsLeft size={14} />}
            >
              First
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={handlePrevPage}
              disabled={pageIndex === 0 || loading}
              leftSection={<IconChevronLeft size={14} />}
            >
              Previous
            </Button>
            <Button
              color="blue"
              size="xs"
              onClick={handleNextPage}
              disabled={!nextCursor || loading}
              rightSection={<IconChevronRight size={14} />}
            >
              Next Page
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Person Detail Modal */}
      <PersonDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onDelete={handleDelete}
      />
    </Container>
  );
}
