"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export type Task = {
  id?: string | number;
  title: string;
  description: string;
};

type TaskDashboardProps = {
  initialTasks: Task[];
};

export function TaskDashboard({ initialTasks }: TaskDashboardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(initialTasks.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to create task");
      }

      setTitle("");
      setDescription("");
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.replace("/login");
  }

  useEffect(() => {
    if (initialTasks.length > 0) {
      return;
    }

    let cancelled = false;

    void fetch("/api/tasks", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load tasks");
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialTasks.length]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Taskflow</h1>
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create and view tasks from your FastAPI backend.
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

        {error && (
          <p className="mb-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

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
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {task.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
