"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LogOut,
  Target,
  TrendingUp,
  User,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type UserData = {
  id: number;
  name: string;
  email: string;
};

const stats = [
  {
    title: "Topics Completed",
    value: "0",
    icon: CheckCircle2,
    description: "Start learning to see progress",
  },
  {
    title: "Study Hours",
    value: "0h",
    icon: Clock3,
    description: "Your total learning time",
  },
  {
    title: "Tests Completed",
    value: "0",
    icon: ClipboardCheck,
    description: "No tests completed yet",
  },
  {
    title: "Current Streak",
    value: "0 days",
    icon: TrendingUp,
    description: "Start your learning streak",
  },
];

const quickActions = [
  {
    title: "Upload Syllabus",
    description: "Let AI analyze your syllabus",
    icon: BookOpen,
    href: "/syllabus",
  },
  {
    title: "Study Plan",
    description: "Create your personalized plan",
    icon: CalendarDays,
    href: "/syllabus",
  },
  {
    title: "Start Learning",
    description: "Continue your learning journey",
    icon: Brain,
    href: "/syllabus",
  },
  {
    title: "Take a Test",
    description: "Test your knowledge",
    icon: ClipboardCheck,
    href: "/syllabus",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json();

        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch (error) {
        console.error("User fetch failed:", error);

        const savedUser = localStorage.getItem("user");

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem("user");
            router.replace("/login");
          }
        } else {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
          <p className="text-sm text-zinc-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative p-6 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-violet-400">
                Welcome back 👋
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {user?.name
                  ? `Welcome, ${user.name}`
                  : "Your Learning Dashboard"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
                Manage your syllabus, follow your study plan, learn smarter,
                and track your progress with Learnova AI.
              </p>
            </div>

            {/* User Information */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:min-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                  <User className="text-violet-400" size={21} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold">
                    {user?.name || "User"}
                  </p>

                  <p className="truncate text-sm text-zinc-500">
                    {user?.email || "Email unavailable"}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs text-zinc-500">
                  User ID
                </p>

                <p className="mt-1 font-mono text-sm font-semibold text-violet-300">
                  #{user?.id ?? "—"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Progress */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Your Progress
              </h2>

              <p className="text-sm text-zinc-500">
                Keep building your learning journey
              </p>
            </div>

            <Target className="text-violet-400" size={22} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-violet-500/30 hover:bg-white/[0.06]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="rounded-xl bg-violet-500/10 p-3">
                      <Icon
                        size={20}
                        className="text-violet-400"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400">
                    {stat.title}
                  </p>

                  <h3 className="mt-1 text-2xl font-bold">
                    {stat.value}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Quick Actions
            </h2>

            <p className="text-sm text-zinc-500">
              Choose what you want to do next
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <a
                  key={action.title}
                  href={action.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-500/40 hover:bg-white/[0.07]"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                    <Icon
                      size={21}
                      className="text-violet-400 transition group-hover:scale-110"
                    />
                  </div>

                  <h3 className="font-semibold">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-zinc-500">
                    {action.description}
                  </p>

                  <div className="mt-4 text-sm font-medium text-violet-400">
                    Open →
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Getting Started */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.10] to-blue-500/[0.05] p-6 backdrop-blur-xl md:p-8">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
              <Brain className="text-violet-400" size={24} />
            </div>

            <h2 className="text-2xl font-bold">
              Start with your syllabus
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">
              Upload your syllabus and let Learnova AI understand your
              subjects, units, and topics. We&apos;ll use that information to
              build your personalized learning journey.
            </p>

            <a
              href="/syllabus"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <BookOpen size={18} />
              Upload Syllabus
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}