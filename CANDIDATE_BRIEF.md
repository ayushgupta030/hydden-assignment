# Engineering Coding Assessment

## Background

You've been handed a scaffold. There is no prototype to inherit and nothing to
reverse-engineer: the persistence layer is written and working, and everything
else is stubbed with a signature and a comment telling you what belongs there.

The application generates a population of **People** and lets a user explore
and prune it. Your job is the pipeline that produces them, the API that serves
them, and the UI that makes them legible.

### What is already done for you

`backend/internal/store` is complete. **Do not modify it.** It gives you:

- `store.Open(path, models...)` -- opens SQLite and migrates the schema to match
  your Go structs. The schema is generated from your code, so you can add,
  rename or drop fields on `Person` and just restart.
- `store.Page[T](db, idColumn, after, limit)` -- keyset pagination. Each page is
  anchored to the last id of the previous one rather than to an offset, so it
  stays correct while rows are being inserted and deleted, and stays fast at any
  depth.
- `store.GroupCount(db, model, column)` -- counts per distinct value, computed by
  the database over the whole population. This is how you build the trend view
  without shipping every row to the browser.
- `store.Reset(path)` -- deletes the database at startup. The data here is
  deliberately ephemeral. **Do not remove this or its call in `main.go`** -- it
  is what lets the schema follow your struct without migrations.

`store_test.go` doubles as usage documentation for all of the above.

The database is SQLite through a pure-Go driver. There is no cgo, no C
toolchain, and nothing to install beyond Go and npm.

### Before you start

Decide how you are going to build the UI **now**, before you write any of it.
Pick a component library, or commit to a small set of your own reused
primitives. Either is fine. What is being looked at is whether the finished
interface looks like one system or like five different afternoons.

## Your Task

### Backend

1. **Define `Person`** in `internal/person/person.go`. The shape is yours, but
   include at least one of each kind of value, so that there is something in the
   data worth noticing:

   | kind | examples |
   |---|---|
   | categorical | country, department, role |
   | numeric | age, salary |
   | temporal | joined date |
   | boolean | active |

2. **Generate the population concurrently.** Several producer goroutines fan
   into a single consumer that writes to the database:

   ```
   producers --> chan Person --> one consumer --> batched writes
   ```

   One consumer, not several: the sink is a single database, so one writer
   batching inserts beats many writers contending for it.

   It must terminate cleanly, store everything the producers sent, and stop
   early when its context is cancelled -- with no deadlock and no leaked
   goroutines. This is the part of the exercise that is easiest to get subtly
   wrong.

3. **Serve it.** `main.go` opens the database and stops there -- starting the
   server is yours. The routes are already registered in
   `internal/api/routes.go` with empty bodies:

   - `GET /api/people` -- paginated. The population can reach six figures.
   - `GET /api/people/{id}` -- one Person, every field.
   - `DELETE /api/people/{id}` -- deleting one that is already gone is not an
     error.

   **People are never created or edited over HTTP.** There is no `POST` and no
   `PATCH` for a Person, by design. Deletion is the only write.

### Frontend

1. **Every value of a Person must be readable somewhere** -- in the list, or in
   a detail view you add.
2. **Make trends obvious.** A reader should be able to see how the population is
   distributed without exporting anything or counting rows themselves. The form
   is your choice; no charting library is required. `store.GroupCount` will do
   the aggregation for you over the whole population.
3. **Deleting works from the UI**, and the list stays consistent afterwards.
4. **The UI is standardized** -- one component vocabulary, applied throughout.

## Deliverables

1. A functional backend that produces `Person` structs without deadlocking.
2. An intuitive UX with a standardized UI -- a component library, or your own
   reused components.
3. **(Bonus)** Further production runs triggerable from the frontend. The
   initial population always happens at startup; a run triggered from the UI
   **adds** to it rather than replacing it, and both the API and the UI keep
   working as the population grows. Extra credit if the whole thing stays
   responsive past 100,000 People.

   A production trigger is a control endpoint, not a write to a Person, so
   `POST /api/produce` is fine and does not contradict the rule above.

4. **(Bonus)** Filtering, on the fields you gave `Person` -- by role, by age
   group, by whether someone leads a team, or whatever your struct offers.

   The filtering has to happen in the database, not in the browser. Narrowing
   the rows you have already fetched filters the page rather than the
   population, which gives a different answer on page two. `store.Page` and
   `store.GroupCount` both take a `*gorm.DB`, so you can pass a query that
   already carries your conditions and let them add paging or grouping on top:

   ```go
   store.Page[person.Person](db.Where("role = ?", role), "person_id", cursor, limit)
   ```

   Nothing in `internal/store` needs to change for this.

   One filter done this way is worth more than four done in the browser.

## Not part of this

No authentication, no deployment, no coverage target, and no changes to
`internal/store`. A couple of meaningful tests are worth more than a suite.

## Time

About an hour with AI assistance. Get the two core deliverables working first;
attempt the bonuses only if time is left over, and do not expect to finish both.

You are encouraged to use AI-assisted coding tools. What is being evaluated is
the design you arrive at -- concurrency that terminates, an API that survives
scale, and an interface someone can actually read -- not your recall of syntax.

## Commits

Commit frequently, in reasonable steps, as you work. Your commit history is how
the hour is measured: it shows what you built in what order and how long it
actually took. One commit at the end tells us nothing and will be read as such.

## Getting Started

```bash
# Backend
cd data_processing/backend
go mod download
go run ./cmd/api   # Recreates data.db, then exits until you start a server
                   # The frontend expects you on :8080

# Frontend
cd data_processing/frontend
npm install
npm run dev        # Runs on :5173, proxies /api to :8080
```
