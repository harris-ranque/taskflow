"""
Transactional email via SendGrid Web API (v3), suitable for RQ background workers.

Configure SENDGRID_API_KEY and EMAIL_FROM (verified sender in SendGrid). Supports
plain/HTML bodies or dynamic templates (`template_id` + `dynamic_template_data`).

Run a worker (from repo root):
    rq worker emails --url redis://localhost:6379/0
"""

from __future__ import annotations

import logging
from typing import Any

import redis
from rq import Queue

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.config import EMAIL_FROM, REDIS_HOST, REDIS_PORT, SENDGRID_API_KEY

logger = logging.getLogger(__name__)

EMAIL_QUEUE_NAME = "emails"

def _redis_connection() -> redis.Redis:
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=False)

def get_email_queue() -> Queue:
    return Queue(EMAIL_QUEUE_NAME, connection=_redis_connection())

def enqueue_send_email(
    to_email: str,
    subject: str | None = None,
    body_text: str | None = None,
    *,
    body_html: str | None = None,
    template_id: str | None = None,
    dynamic_template_data: dict[str, Any] | None = None,
    job_timeout: int = 120,
) -> None:
    """Enqueue a send; call from FastAPI or other app code (same Redis as RQ worker)."""
    q = get_email_queue()
    fn_kwargs: dict[str, Any] = {}
    if body_html is not None:
        fn_kwargs["body_html"] = body_html
    if template_id is not None:
        fn_kwargs["template_id"] = template_id
    if dynamic_template_data is not None:
        fn_kwargs["dynamic_template_data"] = dynamic_template_data
    q.enqueue(
        send_email,
        args=(to_email, subject, body_text),
        kwargs=fn_kwargs,
        job_timeout=job_timeout,
    )


def send_email(
    to_email: str,
    subject: str | None = None,
    body_text: str | None = None,
    *,
    body_html: str | None = None,
    template_id: str | None = None,
    dynamic_template_data: dict[str, Any] | None = None,
) -> str:
    """
    RQ job: send one message. Raises on failure so RQ can retry.

    Use either a SendGrid **dynamic template** (`template_id`) or a regular
    **subject + body** message — not both patterns mixed incorrectly
    (templates carry subject/content from SendGrid).
    """
    if not SENDGRID_API_KEY:
        raise RuntimeError(
            "SENDGRID_API_KEY is not set; add it to your environment.",
        )
    if not EMAIL_FROM:
        raise RuntimeError(
            "EMAIL_FROM must be set to a verified sender in SendGrid.",
        )

    if template_id:
        message = Mail(from_email=EMAIL_FROM, to_emails=to_email)
        message.template_id = template_id
        if dynamic_template_data is not None:
            message.dynamic_template_data = dynamic_template_data
    else:
        if not subject:
            raise ValueError("subject is required when template_id is not used.")
        if not body_text and not body_html:
            raise ValueError("Provide body_text and/or body_html, or use template_id.")
        message = Mail(
            from_email=EMAIL_FROM,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body_text or None,
            html_content=body_html,
        )

    client = SendGridAPIClient(SENDGRID_API_KEY)
    response = client.send(message)

    if response.status_code not in (200, 201, 202):
        body = getattr(response, "body", b"") or b""
        err = body.decode(errors="replace") if isinstance(body, bytes) else str(body)
        raise RuntimeError(
            f"SendGrid returned {response.status_code}: {err}",
        )

    logger.info(
        "SendGrid accepted email to %s status=%s template=%s",
        to_email,
        response.status_code,
        template_id or "—",
    )
    return f"sent:{to_email}"
