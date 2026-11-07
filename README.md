# Restaverse Employee Directory

Search Restaverse employees by **name** or **department**.
**React + Vite** frontend, **Python + FastAPI** backend, **MySQL** database.

- Live app: https://restaverse-employee-directory.vercel.app
- Live API: https://restaverse-employee-directory.onrender.com (health: `/health`)

> The API runs on a free tier that sleeps when idle, so the first request can take 30-60 seconds.

---

## Setup

Requirements: Python 3.10+, Node 18+, MySQL 8.

### 1. Database
```bash
mysql -u root -p < seed.sql
```
Creates the `restaverse_internal` database, the `employees` table with its indexes, and 10 sample rows.

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows Git Bash: source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env               # set DB_USER and DB_PASSWORD for your MySQL
uvicorn app.main:app --reload --port 8000
```
Docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
cp .env.example .env               # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```
Open http://localhost:5173.

### Environment variables (no secrets in the repo)

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `backend/.env` | `CORS_ORIGINS` | Allowed frontend origins (comma-separated, no wildcard) |
| `backend/.env` | `APP_ENV` | `production` disables `/docs` |
| `frontend/.env` | `VITE_API_BASE_URL` | Backend base URL |

---

## API

`GET /api/v1/employees?search=<text>&limit=20&offset=0`

| Param | Rules |
|---|---|
| `search` | Optional, max 100 chars. Omit to list everyone. A blank value returns `400`. |
| `limit` | 1-100, default 20 |
| `offset` | 0-100000, default 0 |

Response: `{ "items": [...], "total": 10, "limit": 20, "offset": 0 }`

Errors use one shape: `{ "error": { "code": "...", "message": "..." } }`
- `400`: blank or oversized search, invalid paging, unknown parameters
- `500`: database or unexpected failure (generic message; the trace stays in server logs)

---

## Database choice

MySQL. The data is relational and fixed in shape (one `employees` table, a unique email, a join date) and the access pattern is simple lookups, which B-tree indexes handle well. Connections go through an async SQLAlchemy engine (`aiomysql`) with a connection pool, `pool_pre_ping`, connection recycling and a 5-second connect timeout. Each request gets its own session through a FastAPI dependency (`get_db`) and credentials come only from environment variables.

Indexes: unique on `email`, composite on `(name, department)`, and a separate one on `department`.

## How search performance is optimized

**Backend**
- `LIKE 'term%'` on `name` and `department` uses the indexes instead of scanning the table. A second `LIKE '% term%'` branch matches the start of any word (for example `sharma` finds Rahul Sharma). That branch cannot use an index, which is fine at directory scale; FULLTEXT or a search service would be the next step for much larger data.
- Pagination (`limit` / `offset`) with stable ordering (`name, id`) keeps responses small.
- User-typed `%` and `_` are escaped, and all queries are parameterised.

**Frontend**
- Typing is debounced (350 ms), so "Rah" produces one request, not three.
- A new request cancels the previous one with `AbortController`, so stale responses never overwrite newer ones.
- Previous results stay visible while the next ones load, so the list does not flicker.
- Loading, results, empty and error states are all handled, with a retry button on errors.

---

## Project structure

```
backend/app/
  routers/        HTTP only (routes, request/response)
  services/       business logic
  repositories/   all database queries
  schemas/        Pydantic validation and response models
  core/           config and error handling
  db/             engine, session, model
frontend/src/
  components/     SearchBar, EmployeeCard, EmployeeList, state views
  hooks/          useEmployeeSearch, useDebouncedValue
  services/       api.js (the only place that calls the network)
seed.sql
```

Layering is `router -> service -> repository -> database`, so adding endpoints such as employee creation means adding a route, a service method and a query.
