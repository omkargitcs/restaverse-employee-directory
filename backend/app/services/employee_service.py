import unicodedata

from app.core.errors import AppError
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee_schema import EmployeeListResponse, EmployeeOut, EmployeeSearchParams


def normalize_query(q: str | None) -> str | None:
    if q is None:
        return None
    if any(unicodedata.category(ch) == "Cc" for ch in q):
        raise AppError(400, "bad_request", "Search query contains invalid control characters")
    cleaned = " ".join(q.split())
    return cleaned or None


class EmployeeService:
    def __init__(self, repo: EmployeeRepository):
        self._repo = repo

    async def search(self, params: EmployeeSearchParams) -> EmployeeListResponse:
        q = normalize_query(params.q)
        rows, total = await self._repo.search(q, params.limit, params.offset)
        return EmployeeListResponse(
            items=[EmployeeOut.model_validate(r) for r in rows],
            total=total,
            limit=params.limit,
            offset=params.offset,
        )
