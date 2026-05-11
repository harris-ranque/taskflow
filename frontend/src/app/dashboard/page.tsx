"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskDashboard } from "@/components/task-dashboard";
import { supabase } from "@/lib/supabase-browser";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) {
        return;
      }

      if (event === "INITIAL_SESSION") {
        if (!nextSession) {
          router.replace("/login");
        } else {
          setSession(nextSession);
        }
        return;
      }

      if (!nextSession) {
        setSession(null);
        router.replace("/login");
        return;
      }

      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (session === undefined) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Checking session...
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Redirecting to login...
        </p>
      </main>
    );
  }

  return <TaskDashboard initialTasks={[]} />;
}
