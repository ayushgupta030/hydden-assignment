import { Card, SimpleGrid, Paper, Text, Group, Progress, Stack, Loader, ThemeIcon } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import type { StatsResponse } from '../api/client';

interface Props {
  stats: StatsResponse | null;
  loading?: boolean;
}

interface CategoryProps {
  title: string;
  data?: Record<string, number>;
  total: number;
  color?: string;
  maxItems?: number;
}

function TrendCategory({ title, data, total, color = 'blue', maxItems = 5 }: CategoryProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper withBorder p="md" radius="md">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase" mb="xs">
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          No data available
        </Text>
      </Paper>
    );
  }

  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);

  const maxCategoryCount = sorted[0]?.[1] || 1;

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase">
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {Object.keys(data).length} total
        </Text>
      </Group>

      <Stack gap="xs">
        {sorted.map(([key, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const relativePercentage = Math.min(100, Math.max(8, (count / maxCategoryCount) * 100));

          let label = key;
          if (key === '1' || key === 'true') label = 'Active';
          if (key === '0' || key === 'false') label = 'Inactive';

          return (
            <div key={key}>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={500}>
                  {label}
                </Text>
                <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {count.toLocaleString()} ({percentage.toFixed(1)}%)
                </Text>
              </Group>
              <Progress value={relativePercentage} size="sm" radius="xl" color={color} />
            </div>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default function TrendPanel({ stats, loading }: Props) {
  const totalPopulation = stats?._total?.count ?? 0;

  return (
    <Card withBorder shadow="sm" radius="md" mb="lg">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue" size="lg" radius="md">
            <IconChartBar size={20} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="lg">
              Population Trends
            </Text>
            <Text size="xs" c="dimmed">
              Aggregate distributions across {totalPopulation.toLocaleString()} database records (computed via store.GroupCount)
            </Text>
          </div>
        </Group>
        {loading && <Loader size="sm" color="blue" />}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <TrendCategory
          title="Department"
          data={stats?.department}
          total={totalPopulation}
          color="indigo"
        />
        <TrendCategory
          title="Country"
          data={stats?.country}
          total={totalPopulation}
          color="blue"
        />
        <TrendCategory
          title="Top Roles"
          data={stats?.role}
          total={totalPopulation}
          color="violet"
        />
        <TrendCategory
          title="Employment Status"
          data={stats?.active}
          total={totalPopulation}
          color="teal"
        />
      </SimpleGrid>
    </Card>
  );
}
