import type { Person } from '../api/client';

interface Props {
  people: Person[];
  onDelete: (id: string) => void;
}

/**
 * Lists People and lets one be deleted.
 *
 * Every field of a Person has to be readable somewhere in the UI -- here, or
 * in a detail view you add. Deleting is the only write: there is no create and
 * no edit anywhere in this application.
 */
export default function PersonTable({ people, onDelete }: Props) {
  // render the list here
  return null;
}
