from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from app.schemas.task import TaskCreate
from app.services.task_service import (create_task, get_tasks)

router = APIRouter()

@router.post("/tasks")
def create(data: TaskCreate):
    return create_task(data)

@router.get("/tasks")
def list_tasks():
    return get_tasks()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/docs")
def docs():
    return RedirectResponse(url="/docs")
