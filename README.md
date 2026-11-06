# Restaverse Employee Directory

Internal employee search: **React 18 + Vite** frontend, **FastAPI** backend, **MySQL 8** store.

## https://restaverse-employee-directory.vercel.app

## Quick start

### 1. Database
Local MySQL: `mysql -u root -p < seed.sql`, then create a user with access to `restaverse_internal`.

### 2. Backend (Python 3.10+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # edit DB credentials if needed
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs · Health: `GET /health`

### 3. Frontend (Node 18+)
```bash
cd frontend
cp .env.example .env          # sets VITE_API_BASE_URL
npm install
npm run dev                   # http://localhost:5173
```
`npm run build` produces a production bundle in `frontend/dist`.

## API

`GET /api/v1/employees?q=<text>&limit=20&offset=0`

| Param | Rules | Notes |
|-------|-------|-------|
| `q` | optional, ≤ 100 chars | matches start of name/department or start of any word in them (case-insensitive) |
| `limit` | 1–100, default 20 | |
| `offset` | 0–100000, default 0 | |

Response: `{ "items": [...], "total": 10, "limit": 20, "offset": 0 }`

Errors always use `{ "error": { "code", "message" } }`:
- `400` malformed/oversized query, bad pagination values, unknown params, control characters
- `500` DB/unexpected failures — message is masked, full trace goes to server logs only

Examples: `?q=rahul`, `?q=eng`, `?q=tech` (→ Culinary Tech), `?q=sharma`.

## Technical decisions

- **Search strategy.** `LIKE 'term%'` on `name`/`department` is index-friendly (`idx_name_dept`, `idx_department`). A second `LIKE '% term%'` branch gives word-prefix matching so last names and the second word of a department work. Wildcards typed by users (`%`, `_`) are escaped, so they are matched literally. *Trade-off:* the word-prefix branch cannot use a B-tree index; at directory scale (thousands of rows) this is negligible. Beyond that, move to a FULLTEXT/ngram index or a search service.
- **Indexes.** Unique on `email`, composite `(name, department)`, plus `department` alone (a composite index with `name` first can't serve department-leading lookups). The unused FULLTEXT index from the original script was dropped to avoid write overhead.
- **Pagination.** `limit`/`offset` with deterministic ordering (`name, id`) and a `total` count; UI has "Load more".
- **Debounce + cancellation.** 350 ms debounce hook; every new request aborts the previous one via `AbortController`. Previous results stay on screen (dimmed) while refetching, so typing doesn't flicker. Skeletons only show when there is nothing to display.
- **Layering.** `routers → services → repositories → db`; Pydantic schemas validate query params (`extra="forbid"`) and serialise responses. Adding CRUD means adding methods/routes, not restructuring.
- **Async DB.** SQLAlchemy 2 async engine (`aiomysql`), pooled, `pool_pre_ping` and `pool_recycle`, 5 s connect timeout, one session per request via `get_db`.

## Security hardening

- Parameterised queries only (no string-built SQL) + LIKE-wildcard escaping.
- Strict input validation (length caps, bounded pagination, control-character rejection, unknown params rejected).
- CORS is an explicit allow-list from `CORS_ORIGINS` (never `*`), GET-only.
- Internal errors never leak stack traces or SQL; validation errors don't echo raw input.
- Swagger/OpenAPI disabled when `APP_ENV=production`.
- Secrets only via `.env` (git-ignored); `.env.example` has placeholders — **change the passwords** in `.env` before any shared deployment.
- Frontend renders all data through React (auto-escaped); no `dangerouslySetInnerHTML`.
- `seed.sql` contains `DROP TABLE` for dev bootstrap — remove it before running against real data.

## Notes
- No Alembic migrations are included: the schema is a single table created by `seed.sql`. Add Alembic when the schema starts evolving.
- Frontend uses plain modular CSS (no Tailwind build step) and axios + a custom hook instead of React Query, since cancellation is handled explicitly with `AbortController`.

## Structure
```
backend/app/{core,db,repositories,services,routers,schemas}/  main.py
frontend/src/{components,hooks,services}/  App.jsx  main.jsx
seed.sql  README.md
```
