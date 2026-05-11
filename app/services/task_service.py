from app.database import create_authenticated_client


def _get_user_id(client, token: str) -> str:
    user_response = client.auth.get_user(token)
    user = getattr(user_response, "user", None)

    if user is None and isinstance(user_response, dict):
        user = user_response.get("user")

    if user is None:
        raise ValueError("Unable to resolve user from token")

    user_id = getattr(user, "id", None)
    if user_id is None and isinstance(user, dict):
        user_id = user.get("id")

    if not user_id:
        raise ValueError("Unable to resolve user id from token")

    return user_id


def create_task(data, token: str):
    client = create_authenticated_client(token)
    user_id = _get_user_id(client, token)

    return client.table("tasks").insert({
        "user_id": user_id,
        "title": data.title,
        "description": data.description,
    }).execute()


def get_tasks(token: str):
    client = create_authenticated_client(token)
    user_id = _get_user_id(client, token)

    return client.table("tasks").select("*").eq("user_id", user_id).execute()


def delete_task(task_id: str, token: str):
    client = create_authenticated_client(token)
    user_id = _get_user_id(client, token)

    return (
        client.table("tasks")
        .delete()
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )

