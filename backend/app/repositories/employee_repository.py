from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Employee

_ESC = "!"


def escape_like(value: str) -> str:
    """Neutralise LIKE wildcards so user input is always treated literally."""
    return value.replace(_ESC, _ESC * 2).replace("%", f"{_ESC}%").replace("_", f"{_ESC}_")


class EmployeeRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def search(self, q: str | None, limit: int, offset: int) -> tuple[list[Employee], int]:
        conditions = []
        if q:
            term = escape_like(q)
            conditions.append(
                or_(
                    # Prefix match: sargable, served by idx_name_dept / idx_department.
                    Employee.name.like(f"{term}%", escape=_ESC),
                    Employee.department.like(f"{term}%", escape=_ESC),
                    # Word-prefix match ("sharma" -> "Rahul Sharma", "tech" -> "Culinary Tech").
                    Employee.name.like(f"% {term}%", escape=_ESC),
                    Employee.department.like(f"% {term}%", escape=_ESC),
                )
            )

        total = (
            await self._session.execute(select(func.count(Employee.id)).where(*conditions))
        ).scalar_one()

        rows = (
            await self._session.execute(
                select(Employee)
                .where(*conditions)
                .order_by(Employee.name, Employee.id)  # deterministic pagination
                .limit(limit)
                .offset(offset)
            )
        ).scalars().all()
        return list(rows), int(total)
