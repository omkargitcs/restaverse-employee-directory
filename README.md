# 🍽️ Restaverse Employee Directory

A fast, no-fuss internal tool for finding teammates across **Engineering, Operations, Culinary Tech, Product, Support and Design**.

Restaverse powers dining experiences across restaurant networks. As the team grows, people need to find each other quickly. Type a name or a team and the right person is on screen, the way a good kitchen finds the right ticket.

| | |
|---|---|
| 🌐 **Live app** | https://restaverse-employee-directory.vercel.app |
| ⚙️ **Live API** | https://restaverse-employee-directory.onrender.com |
| ❤️ **Health check** | https://restaverse-employee-directory.onrender.com/health |

> **Heads-up:** the API runs on a free hosting tier that sleeps when idle. If the first search takes 30–60 seconds, the server is just waking up. After that it's quick.

---

## What it does

- **Live search** by name or department, with partial matches (`eng` finds Engineering, `sharma` finds Rahul Sharma).
- **Smooth typing.** Requests are debounced, and a new keystroke cancels the stale request, so results never flicker or arrive out of order.
- **Every state handled:** loading skeletons, results, a friendly "no matches" screen, and clear error messages with a retry button.
- **Pagination** with a "Load more" button, so the payload stays small as the team grows.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, Axios, plain modular CSS |
| Backend | Python 3.10+, FastAPI, Pydantic v2 |
| Database | MySQL 8 via async SQLAlchemy (`aiomysql`) |
| Hosting | Vercel (frontend), Render (API), Railway (MySQL) |

## How it's organised

```
restaverse-employee-directory/
├── frontend/
│   └── src/
│       ├── components/   SearchBar · EmployeeCard · EmployeeList · state views
│       ├── hooks/        useEmployeeSearch · useDebouncedValue
│       └── services/     api.js  (the only place that talks to the network)
├── backend/
│   └── app/
│       ├── routers/        HTTP only: routes, request/response
│       ├── services/       business logic
│       ├── repositories/   all database queries
│       ├── schemas/        Pydantic models and validation
│       ├── core/           config + uniform error handling
│       └── db/             engine, session, model
├── seed.sql              schema, indexes and 10 sample employees
└── README.md
```

The backend is layered as `router → service → repository → database`. Each layer has a single job, so adding something like "create employee" later means adding a route, a service method and a query. Nothing needs restructuring. On the frontend, UI components stay free of fetching logic: the `useEmployeeSearch` hook owns state, and `api.js` owns the network.

---

## Run it locally

You'll need **Python 3.10+**, **Node 18+** and **MySQL 8**.

### 1. Database
```bash
mysql -u root -p < seed.sql
```
This creates the `restaverse_internal` database, the `employees` table with its indexes, and 10 sample employees.

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows Git Bash: source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env               # then set DB_USER / DB_PASSWORD for your MySQL
uvicorn app.main:app --reload --port 8000
```
Open http://localhost:8000/docs for the interactive API docs, or http://localhost:8000/health for a quick check.

### 3. Frontend
```bash
cd frontend
cp .env.example .env               # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```
Open http://localhost:5173.

### Configuration

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `backend/.env` | `CORS_ORIGINS` | Comma-separated list of allowed frontend origins (never `*`) |
| `backend/.env` | `APP_ENV` | `production` turns off the `/docs` pages |
| `frontend/.env` | `VITE_API_BASE_URL` | Where the frontend finds the API (no trailing slash) |

No host or port is hardcoded in the source. Everything comes from environment files, and real `.env` files are git-ignored.

---

## API

### `GET /api/v1/employees`

| Param | Rules | Notes |
|---|---|---|
| `q` | optional, up to 100 characters | Matches the start of a name or department, or the start of any word in them (case-insensitive) |
| `limit` | 1–100, default 20 | Page size |
| `offset` | 0–100000, default 0 | Where the page starts |

```bash
curl "https://restaverse-employee-directory.onrender.com/api/v1/employees?q=eng&limit=5"
```

```json
{
  "items": [
    {
      "id": 2,
      "name": "Ananya Roy",
      "email": "ananya.roy@restaverse.com",
      "department": "Engineering",
      "designation": "Frontend Developer",
      "date_of_joining": "2022-06-01"
    }
  ],
  "total": 3,
  "limit": 5,
  "offset": 0
}
```

Every error has the same shape, so the frontend never has to guess:

```json
{ "error": { "code": "bad_request", "message": "q: String should have at most 100 characters" } }
```

- **400**: bad input (too-long query, out-of-range paging, unknown parameters).
- **500**: database or unexpected failure. The message is generic and the full trace stays in the server logs only.

---

## Design decisions (and why)

**Search that uses the indexes.** The main match is `LIKE 'term%'`, which MySQL can serve from the index on `name` and `department` instead of scanning the whole table. A second branch, `LIKE '% term%'`, lets people search by last name or the second word of a department. Wildcards a user types (`%`, `_`) are escaped and matched literally.
*Trade-off:* the second branch can't use a B-tree index. For a company directory (hundreds to a few thousand people) that cost is negligible. If the directory ever grows far beyond that, the next step is a FULLTEXT index or a dedicated search service.

**Indexes.** `email` is unique, `(name, department)` is a composite index, and `department` has its own index (a composite index that starts with `name` can't help lookups that start with department). I dropped the FULLTEXT index from the original script because the query doesn't use it and it would only add write overhead.

**Debounce plus cancellation.** A 350 ms debounce stops a request on every keystroke, and `AbortController` cancels any request that's been superseded. Old results stay on screen (slightly dimmed) while new ones load, so the page never jumps. Skeletons appear only when there's nothing to show yet.

**Stable pagination.** Results are ordered by `name, id`, so pages never overlap or skip rows, and the response includes a `total` for the UI.

**Resilient database layer.** The async connection pool uses `pool_pre_ping` to replace dead connections, `pool_recycle` to avoid MySQL idle timeouts, and a 5-second connect timeout so a database outage fails fast instead of hanging.

**Security basics.** Queries are parameterised only. Inputs are length-limited and bounded. CORS is an explicit allow-list and GET-only. Errors never leak SQL or stack traces. React escapes all rendered data. API docs are disabled in production, and secrets live only in environment variables.

---

## Deployment

| Piece | Where | Key settings |
|---|---|---|
| MySQL | Railway | Seed loaded with `mysql ... < seed.sql` |
| API | Render (Web Service) | Root `backend` · build `pip install -r requirements.txt` · start `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Frontend | Vercel | Root `frontend` · build `npm run build` · output `dist` · env `VITE_API_BASE_URL` |

After deploying, set the API's `CORS_ORIGINS` to the exact frontend URL, with no trailing slash.

---

## Scope notes

A few choices were made on purpose to keep the project lean:

- **No Alembic migrations.** With a single table, `seed.sql` is the schema. Alembic is the next step once the schema starts changing.
- **No React Query or Tailwind.** A small custom hook with `AbortController` gives precise control over cancellation, and plain CSS keeps the build simple.
- **`seed.sql` includes `DROP TABLE`** so you can reset a development database in one command. Remove that line before pointing it at real data.

## What I'd build next

- Filter chips by department and sort options
- Employee create/update endpoints (the layering is already set up for this)
- Alembic migrations and automated tests for the search endpoint
- SSL support for the database connection and rate limiting on the API
