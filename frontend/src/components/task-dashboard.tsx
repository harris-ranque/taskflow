"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNotifications } from "@/components/notifications";
import { supabase } from "@/lib/supabase-browser";

export type Task = {
  id?: string | number;
  user_id?: string;
  title: string;
  description: string;
};

type TaskDashboardProps = {
  initialTasks: Task[];
};

function normalizeTasks(payload: unknown): Task[] {
  if (Array.isArray(payload)) {
    return payload as Task[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as Task[]) : [];
  }

  return [];
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session found. Please log in again.");
  }

  return session.access_token;
}

export function TaskDashboard({ initialTasks }: TaskDashboardProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(initialTasks.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | number | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/tasks", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();
      setTasks(normalizeTasks(data));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unknown error", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const token = await getAccessToken();

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to create task");
      }

      setTitle("");
      setDescription("");
      notify("Task created successfully.", { type: "success" });
      await fetchTasks();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unknown error", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      notify(signOutError.message, { type: "error" });
      return;
    }

    notify("Logged out successfully.", { type: "success" });
    router.replace("/login");
  }

  async function handleDeleteTask(taskId: string | number | undefined) {
    if (taskId === undefined) {
      notify("This task cannot be deleted because it has no id.", { type: "error" });
      return;
    }

    setDeletingTaskId(taskId);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to delete task");
      }

      notify("Task deleted successfully.", { type: "success" });
      await fetchTasks();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unknown error", { type: "error" });
    } finally {
      setDeletingTaskId(null);
    }
  }

  useEffect(() => {
    if (initialTasks.length > 0) {
      return;
    }

    const timer = setTimeout(() => {
      void fetchTasks();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchTasks, initialTasks.length]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Taskflow</h1>
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create and view tasks from your FastAPI backend using Supabase.
        </p>
        <button
          className="rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          onClick={() => void handleLogout()}
          type="button"
        >
          Logout
        </button>
      </div>

      <section className="mb-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-4 text-xl font-medium">New Task</h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />
          <button
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Add Task"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">Tasks</h2>
          <button
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
            onClick={() => void fetchTasks()}
            type="button"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-zinc-500">No tasks yet.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task, index) => (
              <li
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                key={task.id ?? `${task.title}-${index}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {task.description}
                    </p>
                  </div>
                  <button
                    className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
                    disabled={deletingTaskId === task.id}
                    onClick={() => void handleDeleteTask(task.id)}
                    type="button"
                  >
                    {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
