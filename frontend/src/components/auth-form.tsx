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

type OAuthProvider = "github" | "google" | "slack" | "discord";

function GithubIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.79c-2.93.64-3.54-1.24-3.54-1.24-.48-1.2-1.17-1.52-1.17-1.52-.96-.65.08-.64.08-.64 1.06.07 1.62 1.1 1.62 1.1.94 1.6 2.47 1.14 3.07.87.1-.68.37-1.15.67-1.42-2.34-.27-4.79-1.17-4.79-5.2 0-1.15.41-2.08 1.1-2.82-.1-.27-.48-1.36.1-2.84 0 0 .9-.29 2.94 1.08a10.1 10.1 0 0 1 5.36 0c2.03-1.37 2.93-1.08 2.93-1.08.58 1.48.22 2.57.1 2.84.69.74 1.1 1.67 1.1 2.82 0 4.05-2.46 4.93-4.81 5.2.38.33.72.98.72 1.98v2.94c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M21.8 12.2c0-.73-.06-1.24-.2-1.78H12v3.57h5.64a4.95 4.95 0 0 1-2.03 3.26l-.02.12 2.9 2.25.2.02c1.84-1.7 2.9-4.2 2.9-7.44Z" fill="#4285F4" />
      <path d="M12 22c2.76 0 5.08-.9 6.78-2.45l-3.23-2.5a6.05 6.05 0 0 1-3.55 1.02 6.16 6.16 0 0 1-5.82-4.25l-.11.01-3 2.33-.04.1A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.18 13.82A6.23 6.23 0 0 1 5.84 12c0-.63.12-1.25.33-1.82l-.01-.12-3.04-2.37-.1.05A10 10 0 0 0 2 12c0 1.6.38 3.12 1.03 4.45l3.15-2.63Z" fill="#FBBC05" />
      <path d="M12 5.92c1.55 0 2.6.67 3.2 1.23l2.34-2.28C16.62 3.99 14.76 3 12 3A10 10 0 0 0 3.03 7.55l3.14 2.5A6.16 6.16 0 0 1 12 5.92Z" fill="#EA4335" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M9.2 3a2.2 2.2 0 1 0 0 4.4h2.2V5.2A2.2 2.2 0 0 0 9.2 3Zm0 5.6H3.6a2.2 2.2 0 1 0 0 4.4h5.6a2.2 2.2 0 0 0 0-4.4Z" fill="#36C5F0" />
      <path d="M21 9.2A2.2 2.2 0 1 0 16.6 9.2v2.2h2.2A2.2 2.2 0 0 0 21 9.2Zm-5.6 0V3.6a2.2 2.2 0 1 0-4.4 0v5.6a2.2 2.2 0 0 0 4.4 0Z" fill="#2EB67D" />
      <path d="M14.8 21a2.2 2.2 0 1 0 0-4.4h-2.2v2.2A2.2 2.2 0 0 0 14.8 21Zm0-5.6h5.6a2.2 2.2 0 1 0 0-4.4h-5.6a2.2 2.2 0 0 0 0 4.4Z" fill="#ECB22E" />
      <path d="M3 14.8a2.2 2.2 0 1 0 4.4 0v-2.2H5.2A2.2 2.2 0 0 0 3 14.8Zm5.6 0v5.6a2.2 2.2 0 1 0 4.4 0v-5.6a2.2 2.2 0 0 0-4.4 0Z" fill="#E01E5A" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M20.3 4.3A17.3 17.3 0 0 0 16 3c-.2.35-.42.82-.58 1.19a16.3 16.3 0 0 0-6.86 0C8.4 3.82 8.18 3.35 7.99 3a17.2 17.2 0 0 0-4.3 1.3C1 8.22.28 12.05.63 15.82a17.4 17.4 0 0 0 5.27 2.66c.42-.56.8-1.17 1.12-1.81-.62-.23-1.22-.52-1.78-.86.15-.11.3-.23.44-.35 3.44 1.6 7.16 1.6 10.56 0 .15.12.3.24.44.35-.56.34-1.16.63-1.78.86.33.64.7 1.25 1.12 1.81a17.3 17.3 0 0 0 5.27-2.66c.41-4.38-.7-8.17-3-11.52ZM8.53 13.44c-1.03 0-1.87-.94-1.87-2.1s.83-2.1 1.87-2.1c1.04 0 1.88.95 1.87 2.1 0 1.16-.83 2.1-1.87 2.1Zm6.94 0c-1.03 0-1.87-.94-1.87-2.1s.83-2.1 1.87-2.1c1.04 0 1.88.95 1.87 2.1 0 1.16-.83 2.1-1.87 2.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M6.6 2.5h2.6c.5 0 .9.3 1 .8l.7 3a1 1 0 0 1-.3 1l-1.7 1.4a14.1 14.1 0 0 0 6.4 6.4l1.4-1.7c.25-.31.66-.44 1.04-.34l2.96.75c.45.12.76.52.76.98v2.6a1 1 0 0 1-.92 1c-.48.04-.95.06-1.43.06C9.96 20.4 3.6 14.04 3.6 6c0-.48.02-.95.06-1.43a1 1 0 0 1 .94-.92Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
  const [phone, setPhone] = useState("");
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

  async function handleOAuthLogin(provider: OAuthProvider) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (oauthError) {
      notify(oauthError instanceof Error ? oauthError.message : "Unknown error", {
        type: "error",
      });
      setLoading(false);
    }
  }

  async function handlePhoneLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });

      if (error) {
        throw error;
      }

      notify("OTP sent to your phone. Check your SMS.", { type: "success" });
    } catch (phoneError) {
      notify(phoneError instanceof Error ? phoneError.message : "Unknown error", {
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

        <div className="my-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            Or continue with
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              disabled={loading}
              onClick={() => void handleOAuthLogin("github")}
              type="button"
            >
              <GithubIcon />
              GitHub
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              disabled={loading}
              onClick={() => void handleOAuthLogin("google")}
              type="button"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              disabled={loading}
              onClick={() => void handleOAuthLogin("slack")}
              type="button"
            >
              <SlackIcon />
              Slack
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              disabled={loading}
              onClick={() => void handleOAuthLogin("discord")}
              type="button"
            >
              <DiscordIcon />
              Discord
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            Phone login (OTP)
          </p>
          <div className="space-y-2">
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              type="tel"
              value={phone}
            />
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              disabled={loading || phone.trim().length === 0}
              onClick={() => void handlePhoneLogin()}
              type="button"
            >
              <PhoneIcon />
              Send OTP
            </button>
          </div>
        </div>

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
