import redis
from app.config import (
    REDIS_HOST,
    REDIS_PORT,
)

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
)

def send_email(email):
    print(f"Sending email to {email}")