from dotenv import load_dotenv
import os

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
REDIS_HOST: str = os.getenv("REDIS_HOST") or "localhost"
REDIS_PORT: int = int(os.getenv("REDIS_PORT") or "6379")

