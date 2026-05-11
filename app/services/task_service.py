from app.database import supabase

def create_task(data):
    return supabase.table("tasks").insert({
        "title": data.title,
        "description": data.description,
    }).execute()

def get_tasks():
    return supabase.table("tasks").select("*").execute()

    