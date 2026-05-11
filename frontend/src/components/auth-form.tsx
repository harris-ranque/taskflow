"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useNotifications } from "@/components/notifications";
import { supabase } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { notify } = useNotifications();

  useEffect(() => {
    let mounted = true;
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted || !nextSession) {
        return;
      }
  
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        router.replace("/dashboard");
      }
    });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        const session =
          data.session ?? (await supabase.auth.getSession()).data.session;

        if (session) {
          router.replace("/dashboard");
          return;
        }

        notify("Signup successful. Please login to continue.", { type: "success" });
      } else {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (loginError) {
          throw loginError;
        }

        const session = data.session ?? (await supabase.auth.getSession()).data.session;

        if (session) {
          router.replace("/dashboard");
          return;
        }

        notify("Login succeeded but no active session was returned.", { type: "error" });
      }
    } catch (submitError) {
      notify(submitError instanceof Error ? submitError.message : "Unknown error", {
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <section className="w-full rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h1 className="mb-1 text-2xl font-semibold">
          {isSignup ? "Create account" : "Login"}
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          {isSignup ? "Sign up to start using Taskflow." : "Welcome back."}
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
          />
          <button
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isSignup
                ? "Creating..."
                : "Signing in..."
              : isSignup
                ? "Sign up"
                : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {isSignup ? "Already have an account? " : "Need an account? "}
          <Link
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            href={isSignup ? "/login" : "/signup"}
          >
            {isSignup ? "Login" : "Sign up"}
          </Link>
        </p>
      </section>
    </main>
  );
}
