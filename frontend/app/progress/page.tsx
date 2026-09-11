"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Target,
  Trophy,
  BookOpen,
  TrendingUp,
} from "lucide-react";

const subjects = [
  {
    name: "Subject 1",
    progress: 0,
    topics: 0,
  },
  {
    name: "Subject 2",
    progress: 0,
    topics: 0,
  },
  {
    name: "Subject 3",
    progress: 0,
    topics: 0,
  },
];

export default function ProgressPage() {
  const overallProgress = 0;

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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
            <BarChart3
              size={25}
              className="text-violet-400"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            Your Progress
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Track your learning progress, completed topics,
            study time and test performance.
          </p>
        </header>

        {/* Overall Progress */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Target className="text-violet-400" size={21} />

                <h2 className="text-lg font-semibold">
                  Overall Learning Progress
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Complete lessons, quizzes and study sessions
                to increase your progress.
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-4xl font-bold text-violet-400">
                {overallProgress}%
              </p>

              <p className="text-xs text-zinc-500">
                Overall
              </p>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
              <CheckCircle2
                size={21}
                className="text-violet-400"
              />
            </div>

            <p className="text-sm text-zinc-400">
              Topics Completed
            </p>

            <h3 className="mt-1 text-3xl font-bold">
              0
            </h3>

            <p className="mt-2 text-xs text-zinc-500">
              Keep learning
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
              <Clock3
                size={21}
                className="text-blue-400"
              />
            </div>

            <p className="text-sm text-zinc-400">
              Study Hours
            </p>

            <h3 className="mt-1 text-3xl font-bold">
              0h
            </h3>

            <p className="mt-2 text-xs text-zinc-500">
              Total learning time
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10">
              <Trophy
                size={21}
                className="text-green-400"
              />
            </div>

            <p className="text-sm text-zinc-400">
              Tests Completed
            </p>

            <h3 className="mt-1 text-3xl font-bold">
              0
            </h3>

            <p className="mt-2 text-xs text-zinc-500">
              No tests yet
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
              <TrendingUp
                size={21}
                className="text-orange-400"
              />
            </div>

            <p className="text-sm text-zinc-400">
              Current Streak
            </p>

            <h3 className="mt-1 text-3xl font-bold">
              0 days
            </h3>

            <p className="mt-2 text-xs text-zinc-500">
              Start your streak
            </p>
          </div>
        </section>

        {/* Subject Progress */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Subject Progress
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your progress across subjects
            </p>
          </div>

          <div className="space-y-4">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                      <BookOpen
                        size={19}
                        className="text-violet-400"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {subject.name}
                      </h3>

                      <p className="text-xs text-zinc-500">
                        {subject.topics} topics completed
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-violet-400">
                    {subject.progress}%
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${subject.progress}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Empty State */}
        <section className="rounded-3xl border border-violet-500/20 bg-violet-500/[0.05] p-6 md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
            <BarChart3
              size={24}
              className="text-violet-400"
            />
          </div>

          <h2 className="mt-5 text-2xl font-bold">
            Start Learning to Track Progress
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Upload your syllabus and start learning. Your
            completed topics, study time and quiz results will
            appear here.
          </p>

          <a
            href="/syllabus"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <BookOpen size={18} />
            Start Learning
          </a>
        </section>
      </div>
    </div>
  );
}
