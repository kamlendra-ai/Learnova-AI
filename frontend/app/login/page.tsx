"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isSignup && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (isSignup && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? `${API_URL}/api/auth/signup`
        : `${API_URL}/api/auth/login`;

      const body = isSignup
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Something went wrong. Please try again."
        );
      }

      if (data.access_token) {
        localStorage.setItem(
          "access_token",
          data.access_token
        );
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setSuccess(
        isSignup
          ? "Account created successfully!"
          : "Login successful!"
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to Learnova server. Please make sure the backend is running."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsSignup((current) => !current);
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black text-xl font-bold shadow-lg">
            L
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Learnova AI
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Your AI-powered learning platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              {isSignup
                ? "Start your personalized learning journey."
                : "Sign in to continue learning."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            {isSignup && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    isSignup
                      ? "new-password"
                      : "current-password"
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {isSignup && (
                <p className="mt-2 text-xs text-zinc-500">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isSignup
                  ? "Creating account..."
                  : "Signing in..."
                : isSignup
                  ? "Create Account"
                  : "Login"}
            </button>
          </form>

          {/* Switch */}
          <div className="mt-6 border-t border-zinc-800 pt-5 text-center text-sm">
            <span className="text-zinc-500">
              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-white hover:underline"
            >
              {isSignup ? "Login" : "Create Account"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Learnova AI • Learn smarter, stay consistent.
        </p>
      </div>
    </main>
  );
}