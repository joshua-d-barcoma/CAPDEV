from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=1, max_length=1024)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str = Field(default="", max_length=4000)
    due_date: date | None = None
    priority: Literal["Low", "Medium", "High"] = "Medium"
    category: str = Field(default="Personal", min_length=1, max_length=100)


class TaskStatusUpdate(BaseModel):
    status: Literal["Not Started", "In Progress", "Completed"]


class ActionItemStatusUpdate(BaseModel):
    status: Literal["Open", "In Progress", "Done"]


class ActionItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str = Field(default="", max_length=4000)
    category: str = Field(min_length=1, max_length=100)
    owner: str = Field(min_length=1, max_length=150)
    due_date: date | None = None
    priority: Literal["Low", "Medium", "High"] = "Medium"


class AttendanceSubmission(BaseModel):
    work_type: Literal["Onsite", "Work from home"]
    location: str | None = Field(default=None, max_length=250)


class ScheduleUpdate(BaseModel):
    weekday: Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    work_type: Literal["Onsite", "Work from home"]
    location: str | None = Field(default=None, max_length=250)


class TrainingApplicabilityUpdate(BaseModel):
    course_id: int
    population_rule: str = Field(min_length=1, max_length=1000)
    effective_from: date
    effective_to: date | None = None
