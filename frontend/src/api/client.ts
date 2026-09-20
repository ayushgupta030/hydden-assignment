// Thin wrapper around the backend. Fill in the bodies.
//
// Vite proxies /api to the Go server on :8080, so relative URLs work in dev.

/** Mirror whatever fields you put on the Go Person struct. */
export interface Person {
  personId: string;
  // fill in the rest
}

export interface PeoplePage {
  people: Person[];
  /** Cursor for the following page, absent on the last page. */
  next?: string;
}

/** One page of People. The population can reach six figures: never fetch it all. */
export async function listPeople(cursor?: string, limit = 50): Promise<PeoplePage> {
  throw new Error('not implemented');
}

export async function getPerson(id: string): Promise<Person> {
  throw new Error('not implemented');
}

export async function deletePerson(id: string): Promise<void> {
  throw new Error('not implemented');
}

// Bonus: ask the backend for another production run. It adds to the existing
// population rather than replacing it.
// export async function produce(count: number): Promise<void> {}
