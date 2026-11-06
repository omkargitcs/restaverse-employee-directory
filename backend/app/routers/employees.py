from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee_schema import EmployeeListResponse, EmployeeSearchParams, ErrorResponse
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["employees"])


def get_employee_service(db: AsyncSession = Depends(get_db)) -> EmployeeService:
    return EmployeeService(EmployeeRepository(db))


@router.get(
    "",
    response_model=EmployeeListResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Search employees by name or department",
)
async def list_employees(
    params: Annotated[EmployeeSearchParams, Query()],
    service: EmployeeService = Depends(get_employee_service),
) -> EmployeeListResponse:
    return await service.search(params)
