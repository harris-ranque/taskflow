from app.database import create_authenticated_client
from app.worker.email_worker import enqueue_send_email


def _get_user_email(client, token: str) -> str:
    user_response = client.auth.get_user(token)
    user = getattr(user_response, "user", None)

    if user is None and isinstance(user_response, dict):
        user = user_response.get("user")

    if user is None:
        raise ValueError("Unable to resolve user from token")

    email = getattr(user, "email", None)
    if email is None and isinstance(user, dict):
        email = user.get("email")

    if not email:
        raise ValueError("Unable to resolve user email from token")

    return email


def enqueue_welcome_email(token: str) -> dict[str, str]:
    client = create_authenticated_client(token)
    email = _get_user_email(client, token)

    enqueue_send_email(
        to_email=email,
        subject="Welcome to Taskflow",
        body_text="Your account is ready. Start tracking your tasks in Taskflow.",
        body_html=(
            "<p>Your account is ready.</p>"
            "<p>Start tracking your tasks in <strong>Taskflow</strong>.</p>"
        ),
    )
    return {"status": "queued", "email": email}
