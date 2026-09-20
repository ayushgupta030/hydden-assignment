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

export interface FilterOptions {
  department?: string;
  role?: string;
  country?: string;
  active?: boolean | string;
}

function buildFilterParams(filters?: FilterOptions): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  if (filters.department) params.set('department', filters.department);
  if (filters.role) params.set('role', filters.role);
  if (filters.country) params.set('country', filters.country);
  if (filters.active !== undefined && filters.active !== '') {
    params.set('active', String(filters.active));
  }
  return params;
}

/** One page of People with database-side filtering. The population can reach six figures: never fetch it all. */
export async function listPeople(cursor?: string, limit = 50, filters?: FilterOptions): Promise<PeoplePage> {
  const params = buildFilterParams(filters);
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const query = params.toString();
  const res = await fetch(`/api/people${query ? `?${query}` : ''}`);
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

export async function getStats(filters?: FilterOptions): Promise<StatsResponse> {
  const params = buildFilterParams(filters);
  const query = params.toString();
  const res = await fetch(`/api/people/stats${query ? `?${query}` : ''}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Trigger another production run. Appends to the existing population. */
export async function produce(count: number): Promise<{ status: string; generated: number }> {
  const res = await fetch('/api/produce', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger production: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
