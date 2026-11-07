from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class EmployeeSearchParams(BaseModel):
    """Validated query parameters for GET /employees (unknown params are rejected)."""

    model_config = ConfigDict(extra="forbid")

    search: str | None = Field(default=None, max_length=100, description="Search name or department")
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0, le=100_000)


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    department: str
    designation: str
    date_of_joining: date


class EmployeeListResponse(BaseModel):
    items: list[EmployeeOut]
    total: int
    limit: int
    offset: int


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
