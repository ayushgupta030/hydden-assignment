import { Card, Group, Select, Button, Text, Badge } from '@mantine/core';
import { IconFilter, IconX } from '@tabler/icons-react';
import type { FilterOptions } from '../api/client';

interface Props {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  departments?: string[];
  countries?: string[];
}

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Operations',
];

const DEFAULT_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'Canada',
  'France',
  'Australia',
  'Japan',
  'India',
  'Netherlands',
  'Singapore',
  'Spain',
  'Brazil',
  'Sweden',
  'Switzerland',
  'Ireland',
];

export default function FilterBar({
  filters,
  onChange,
  departments = DEFAULT_DEPARTMENTS,
  countries = DEFAULT_COUNTRIES,
}: Props) {
  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  const handleSelect = (key: keyof FilterOptions, value: string | null) => {
    onChange({
      ...filters,
      [key]: value === null || value === '' ? undefined : value,
    });
  };

  const handleClear = () => {
    onChange({});
  };

  return (
    <Card withBorder shadow="xs" p="sm" radius="md" mb="md">
      <Group gap="sm" wrap="wrap">
        <Group gap={6}>
          <IconFilter size={18} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Database Filters:
          </Text>
        </Group>

        <Select
          size="xs"
          placeholder="All Departments"
          data={departments}
          value={filters.department || null}
          onChange={(val) => handleSelect('department', val)}
          clearable
          searchable
          style={{ width: 170 }}
        />

        <Select
          size="xs"
          placeholder="All Countries"
          data={countries}
          value={filters.country || null}
          onChange={(val) => handleSelect('country', val)}
          clearable
          searchable
          style={{ width: 160 }}
        />

        <Select
          size="xs"
          placeholder="All Statuses"
          data={[
            { value: 'true', label: 'Active only' },
            { value: 'false', label: 'Inactive only' },
          ]}
          value={filters.active === undefined ? null : String(filters.active)}
          onChange={(val) => handleSelect('active', val)}
          clearable
          style={{ width: 140 }}
        />

        {activeCount > 0 && (
          <Group gap="xs" style={{ marginLeft: 'auto' }}>
            <Badge size="sm" variant="light" color="blue">
              {activeCount} active
            </Badge>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconX size={14} />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </Group>
        )}
      </Group>
    </Card>
  );
}
