from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class EmployeeRead(ApiModel):
    id: int
    employee_id: str | None = None
    first_name: str
    last_name: str
    preferred_name: str | None = None
    email: str | None = None
    job_profile: str | None = None
    management_level: int | None = None
    capability_area: str | None = None
    location: str | None = None
    activity_type: str | None = None
    project: str | None = None
    client: str | None = None
    is_active: int
    hire_date: date | None = None
    people_lead_id: int | None = None
    is_people_lead: int | None = None
    skills: list[str] = Field(default_factory=list)


class AttendanceRead(ApiModel):
    id: str
    employee_id: str
    worker_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    capability: str | None = None
    date: date
    time_in: str
    work_type: Literal["Onsite", "Work from home"]
    location: str | None = None
    status: Literal["Present", "Absent"]
    rto_compliant: bool | int | None = None
    follow_up: bool | int = False


class TaskRead(ApiModel):
    id: str
    employee_id: str
    title: str
    description: str
    due_date: date | None = None
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Not Started", "In Progress", "Completed"]
    category: str


class ActionItemRead(ApiModel):
    id: str
    title: str
    description: str
    category: str
    owner: str
    due_date: date | None = None
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Open", "In Progress", "Done"]


class TrainingApplicabilityRead(ApiModel):
    id: int
    course_id: int
    course_name: str | None = None
    population_rule: str
    effective_from: date
    effective_to: date | None = None
