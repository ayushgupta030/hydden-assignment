import { Table, Badge, Button, ActionIcon, Group, Text, Center, Stack } from '@mantine/core';
import { IconTrash, IconEye, IconUsers } from '@tabler/icons-react';
import type { Person } from '../api/client';

interface Props {
  people: Person[];
  onDelete: (id: string) => void;
  onSelectPerson?: (person: Person) => void;
}

export default function PersonTable({ people, onDelete, onSelectPerson }: Props) {
  if (people.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap="xs">
          <IconUsers size={40} stroke={1.5} color="var(--mantine-color-gray-5)" />
          <Text fw={600} size="lg">
            No people found
          </Text>
          <Text size="sm" c="dimmed">
            No records match the current criteria or population has not been generated yet.
          </Text>
        </Stack>
      </Center>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table striped highlightOnHover verticalSpacing="sm" withRowBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Country</Table.Th>
            <Table.Th>Age</Table.Th>
            <Table.Th>Salary</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {people.map((p) => (
            <Table.Tr
              key={p.id}
              onClick={() => onSelectPerson?.(p)}
              style={{ cursor: 'pointer' }}
            >
              <Table.Td fw={600}>{p.name}</Table.Td>
              <Table.Td>{p.role}</Table.Td>
              <Table.Td>
                <Badge variant="light" color="blue" size="sm">
                  {p.department}
                </Badge>
              </Table.Td>
              <Table.Td>{p.country}</Table.Td>
              <Table.Td>{p.age}</Table.Td>
              <Table.Td style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(p.salary)}
              </Table.Td>
              <Table.Td>
                <Badge
                  variant="dot"
                  color={p.active ? 'teal' : 'gray'}
                  size="sm"
                >
                  {p.active ? 'Active' : 'Inactive'}
                </Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" justify="flex-end">
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconEye size={14} />}
                    onClick={() => onSelectPerson?.(p)}
                  >
                    Details
                  </Button>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete ${p.name}?`)) {
                        onDelete(p.id);
                      }
                    }}
                    title="Delete person"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
