# API Integration Tests

Full end-to-end tests for the Clinic API, using Node's built-in test runner
(`node:test`). No extra dependencies. They exercise the real stack:
**routes → controllers → services → PostgreSQL**.

## Prerequisites

The tests hit a **running** server and database (the same ones used in dev):

```bash
# 1) from the repo root — start Postgres on :15432
npm run docker:db:start

# 2) start the API on :4000
cd server
npm run dev
```

## Run

```bash
cd server
npm test
```

You should see `pass 46  fail 0`.

## What is covered

- **Health & config** — `/health` and all 7 `/api/config/*` dropdown lists.
- **Patients / Doctors / Visits** — create, read, update, delete, list, search.
- **Edge cases** — 404 for unknown records; foreign-key delete guards
  (can't delete a patient with visits, or a doctor who is appointed).
- **Clinical charts** — appointed-doctor, prescription, treatment, diagnosis:
  save + read back, and the "re-save replaces (not duplicates)" behaviour.
- **Billing** — auto-populate bill from charts, idempotent create, bill lines,
  payment transactions, and listing.
- **Reports** — all 15 report endpoints + date filters.
- **Data integrity** — regression test for the duplicate-key / out-of-sync
  sequence bug: many creates in a row stay unique, and the identity sequence
  stays equal to `MAX(id)`.

## Test data is self-cleaning

Every record a test creates is tagged with the marker `__APITEST__` in its
name/symptoms. `cleanupTestData()` deletes all tagged rows (in foreign-key
order) **before and after** the run, so the suite is safe to run repeatedly and
never pollutes or deletes real seed data.

## Configuration

- `TEST_API_BASE` — override the API URL (default `http://localhost:4000`).
- `DATABASE_URL` — override the DB connection used for setup/cleanup
  (default `postgresql://root:root@localhost:15432/clinic_db`).
