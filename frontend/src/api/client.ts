// Thin wrapper around the backend.
// Vite proxies /api to the Go server on :8080, so relative URLs work in dev.

/** Mirror whatever fields you put on the Go Person struct. */
export interface Person {
  id: string;
  name: string;
  country: string;
  department: string;
  role: string;
  age: number;
  salary: number;
  joinedAt: string;
  active: boolean;
}

export interface PeoplePage {
  people: Person[];
  /** Cursor for the following page, absent on the last page. */
  next?: string;
}

export interface StatsResponse {
  country?: Record<string, number>;
  department?: Record<string, number>;
  role?: Record<string, number>;
  active?: Record<string, number>;
  _total?: { count: number };
}

/** One page of People. The population can reach six figures: never fetch it all. */
export async function listPeople(cursor?: string, limit = 50): Promise<PeoplePage> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const res = await fetch(`/api/people?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch people: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getPerson(id: string): Promise<Person> {
  const res = await fetch(`/api/people/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch person ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function deletePerson(id: string): Promise<void> {
  const res = await fetch(`/api/people/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete person ${id}: ${res.status} ${res.statusText}`);
  }
}

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch('/api/people/stats');
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
