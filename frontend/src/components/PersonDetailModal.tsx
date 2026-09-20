import { Modal, Text, Title, Badge, Group, Stack, SimpleGrid, Paper, Button, Code } from '@mantine/core';
import { IconTrash, IconCalendar, IconCurrencyDollar, IconBuilding, IconBriefcase, IconMapPin, IconUser, IconId } from '@tabler/icons-react';
import type { Person } from '../api/client';

interface Props {
  person: Person | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function PersonDetailModal({ person, onClose, onDelete }: Props) {
  if (!person) return null;

  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(person.salary);

  const formattedJoinedAt = new Date(person.joinedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal
      opened={!!person}
      onClose={onClose}
      title={
        <div>
          <Title order={4}>{person.name}</Title>
          <Text size="xs" c="dimmed">
            {person.role} • {person.department}
          </Text>
        </div>
      }
      centered
      size="lg"
    >
      <Stack gap="sm">
        <Paper withBorder p="xs" radius="sm">
          <Group gap="xs">
            <IconId size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Person ID
            </Text>
          </Group>
          <Code block mt={4} style={{ fontSize: '0.8rem' }}>
            {person.id}
          </Code>
        </Paper>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Paper withBorder p="xs" radius="sm">
            <Group gap="xs">
              <IconMapPin size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Country
              </Text>
            </Group>
            <Text fw={500} mt={2}>
              {person.country}
            </Text>
          </Paper>

          <Paper withBorder p="xs" radius="sm">
            <Group gap="xs">
              <IconBuilding size={16} style={{ color: 'var(--mantine-color-indigo-6)' }} />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Department
              </Text>
            </Group>
            <Text fw={500} mt={2}>
              {person.department}
            </Text>
          </Paper>

          <Paper withBorder p="xs" radius="sm">
            <Group gap="xs">
              <IconBriefcase size={16} style={{ color: 'var(--mantine-color-violet-6)' }} />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Role
              </Text>
            </Group>
            <Text fw={500} mt={2}>
              {person.role}
            </Text>
          </Paper>

          <Paper withBorder p="xs" radius="sm">
            <Group gap="xs">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Employment Status
              </Text>
            </Group>
            <Badge mt={4} color={person.active ? 'teal' : 'gray'} variant="light">
              {person.active ? 'Active' : 'Inactive'}
            </Badge>
          </Paper>

          <Paper withBorder p="xs" radius="sm">
            <Group gap="xs">
              <IconUser size={16} style={{ color: 'var(--mantine-color-teal-6)' }} />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Age
              </Text>
            </Group>
            <Text fw={500} mt={2}>
              {person.age} years
            </Text>
          </Paper>

          <Paper withBorder p="xs" radius="sm">
            <Group gap="xs">
              <IconCurrencyDollar size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Salary
              </Text>
            </Group>
            <Text fw={600} c="teal.8" mt={2}>
              {formattedSalary}
            </Text>
          </Paper>
        </SimpleGrid>

        <Paper withBorder p="xs" radius="sm">
          <Group gap="xs">
            <IconCalendar size={16} style={{ color: 'var(--mantine-color-orange-6)' }} />
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Joined Date
            </Text>
          </Group>
          <Text fw={500} mt={2}>
            {formattedJoinedAt}
          </Text>
        </Paper>

        <Group justify="space-between" mt="md">
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={16} />}
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
                onDelete(person.id);
                onClose();
              }
            }}
          >
            Delete Person
          </Button>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
