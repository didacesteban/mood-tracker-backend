# Project Memory — Moodtracker Backend

Living record of the scope, architectural decisions, and their rationale.
Update it whenever a decision is made or changed. Each decision lists the alternatives considered so the reasoning stays visible for learning.

_Last updated: 2026-10-04_

---

## Scope (MVP)

1. **Auth** — register, login, refresh, logout.
   - Future: Google OAuth sign-in and email verification. The schema is designed to allow both without breaking changes.
2. **Save / edit today's mood** — score (0–10), note explaining the score, date generated server-side. Only the current day (in the user's timezone) can be created or edited.
3. **List mood entries** — score + note + date, filterable by date range.
4. **List scores by day** — date + score only, filterable by date range.

---

## Decisions

### D1 — Database: PostgreSQL only
- **Chosen:** a single PostgreSQL database for users, tokens, and mood entries. Run locally in Docker.
- **Rejected:** Postgres (users) + MongoDB (moods) — the data is relational (entry belongs to user, one per day); splitting loses foreign keys, unique constraints, joins and cross-store transactions, and doubles ops work.
- **Rejected (for now):** Supabase Auth / auto-generated API — would replace the backend we want to learn to build, and couples identities to a vendor. Supabase may still be used later **as a plain hosted Postgres**.
- Escape hatch: Postgres `jsonb` if flexible fields are ever needed.

### D2 — ORM: TypeORM
- **Pros:** official NestJS integration (`@nestjs/typeorm`), decorator entities, mature migrations.
- **Cons / risks:** weaker type safety on query results than Prisma/Drizzle; watch for N+1 with relations.
- **Rule:** never rely on `synchronize: true` beyond throwaway experiments — use **migrations** from day one.

### D3 — "Today": user's IANA timezone, computed server-side
- Each user stores an IANA timezone (e.g. `Europe/Madrid`). The server computes the user's local date; the client never sends the date when writing.
- **Rejected:** server UTC date (wrong near midnight for most users); client-sent date (untrusted, allows backdating).
- Storage: entry day as a `DATE` column; `created_at` / `updated_at` as `timestamptz`.
- **Timezone change:** "today" is always computed from the user's *current* timezone. Stored `entry_date` values are never recomputed. Accepted edge cases: changing timezone can re-open yesterday's entry for editing or skip a day; the timezone must be validated as a real IANA zone.

### D4 — Auth tokens: short-lived access JWT + refresh token
- **Access token:** JWT, short-lived (~15 min), sent as bearer token, validated statelessly.
- **Refresh token:** long-lived, stored **hashed** in the database, used via `POST /auth/refresh`. Logout revokes it → real logout.
- **Rejected:** stateless JWT only (no real logout; a stolen token is valid until expiry).
- Passwords hashed with argon2 (or bcrypt). Generic "invalid credentials" errors.
- Planned for later: refresh token rotation + reuse detection.

### D5 — Write endpoints: `POST /moods` + `PATCH /moods/:id`
- `POST /moods` creates today's entry. A second POST on the same day → **409 Conflict** (map the unique-constraint violation, don't pre-check only — race conditions).
- `PATCH /moods/:id` edits an entry only if it **belongs to the caller** (otherwise 404, to avoid leaking existence) **and** its `entry_date` equals the caller's current local date (otherwise 403/422).
- Client discovers today's entry id via `GET /moods?from=<today>&to=<today>` (or the POST 409 response).
- **Rejected:** `PUT /moods/today` upsert — simpler and idempotent, but less conventional REST; chosen shape is better practice for ownership checks.

### D6 — Note: optional, generous cap
- Note is optional (nullable). Empty / whitespace-only strings normalized to `null`.
- Column type `text` (no DB limit). A generous cap (e.g. 5,000 chars) is enforced in the DTO only, so it can change without a migration.
- **Why a cap at all:** protects against abuse and bloated range responses; the HTTP body size limit is a second guard.

---

## Conceptual data model

- **users** — id (UUID), email (unique, case-insensitive), password_hash (nullable, for future OAuth-only users), email_verified_at (nullable), timezone, created_at, updated_at
- **refresh_tokens** — id, user_id (FK, cascade delete), token_hash, expires_at, revoked_at (nullable), created_at
- **mood_entries** — id, user_id (FK, cascade delete), entry_date (`DATE`), score (smallint, CHECK 0–10), note (text, nullable; length capped in DTO), created_at, updated_at
  - UNIQUE (user_id, entry_date) — enforces one entry per day and serves as the index for range queries.

---

## API surface (draft)

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /moods` — create today's entry (409 if it exists)
- `PATCH /moods/:id` — edit own entry, today only
- `GET /moods?from=YYYY-MM-DD&to=YYYY-MM-DD` — full entries
- `GET /moods/scores?from=&to=` — date + score only
- Range endpoints: validate `from ≤ to`, default range (e.g. last 30 days), max span, sorted by date.

---

## Module structure (planned)

- **ConfigModule** — env vars, validated at startup.
- **DatabaseModule** — TypeORM setup.
- **UsersModule** — user persistence only.
- **AuthModule** — controller, service, JWT strategy, `JwtAuthGuard`, refresh token handling.
- **MoodsModule** — controller, service, DTOs.
- Cross-cutting: global `ValidationPipe` (whitelist on), `@CurrentUser()` decorator.
- **Security rule:** the user id always comes from the token, never from the request body.

---

## Open questions

- [x] Write endpoint shape → D5
- [x] Note rules → D6
- [x] Timezone change behaviour → D3
- [ ] Exact note cap value (proposed 5,000 chars)

## Progress

- [x] Scope and core decisions (D1–D6)
- [ ] Step 1: scaffold NestJS project + Postgres in Docker
