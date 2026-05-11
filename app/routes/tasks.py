from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import RedirectResponse
from app.schemas.task import TaskCreate
from app.services.task_service import (create_task, delete_task, get_tasks)

router = APIRouter()


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return authorization.split(" ", 1)[1].strip()


@router.post("/tasks")
def create(data: TaskCreate, authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)
    return create_task(data, token)

@router.get("/tasks")
def list_tasks(authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)
    return get_tasks(token)


@router.delete("/tasks/{task_id}")
def remove_task(task_id: str, authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)
    return delete_task(task_id, token)


@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/docs")
def docs():
    return RedirectResponse(url="/docs")
