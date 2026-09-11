"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  BookOpen,
  Target,
} from "lucide-react";

const studyDays = [
  {
    day: "Day 1",
    title: "Understand Your Syllabus",
    description: "Review subjects, units and important topics.",
    duration: "30 min",
  },
  {
    day: "Day 2",
    title: "Start Core Concepts",
    description: "Study the first important topics from your syllabus.",
    duration: "60 min",
  },
  {
    day: "Day 3",
    title: "Practice & Revision",
    description: "Revise what you studied and solve practice questions.",
    duration: "60 min",
  },
  {
    day: "Day 4",
    title: "Deep Learning",
    description: "Continue with difficult and high-priority topics.",
    duration: "90 min",
  },
  {
    day: "Day 5",
    title: "Quiz & Assessment",
    description: "Test your understanding with AI-generated questions.",
    duration: "45 min",
  },
];

export default function StudyPlanPage() {
  const [completed, setCompleted] = useState<number[]>([]);

  function toggleComplete(index: number) {
    setCompleted((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  }

  const progress = Math.round(
    (completed.length / studyDays.length) * 100
  );

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
            <CalendarDays
              size={25}
              className="text-violet-400"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            Your Study Plan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Follow your personalized learning journey and complete
            your study goals step by step.
          </p>
        </header>

        {/* Progress Card */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Target
                  size={21}
                  className="text-violet-400"
                />

                <h2 className="text-lg font-semibold">
                  Overall Progress
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                {completed.length} of {studyDays.length} study sessions
                completed
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-3xl font-bold text-violet-400">
                {progress}%
              </p>

              <p className="text-xs text-zinc-500">
                Completed
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Study Sessions */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Learning Schedule
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Complete each session to build your progress.
            </p>
          </div>

          <div className="space-y-4">
            {studyDays.map((item, index) => {
              const isCompleted = completed.includes(index);

              return (
                <div
                  key={item.day}
                  className={`rounded-2xl border p-5 backdrop-blur-xl transition ${
                    isCompleted
                      ? "border-green-500/20 bg-green-500/[0.04]"
                      : "border-white/10 bg-white/[0.04] hover:border-violet-500/30"
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    {/* Day */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                      {isCompleted ? (
                        <CheckCircle2
                          size={23}
                          className="text-green-400"
                        />
                      ) : (
                        <BookOpen
                          size={22}
                          className="text-violet-400"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-violet-400">
                        {item.day}
                      </p>

                      <h3 className="mt-1 font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-zinc-500">
                        {item.description}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                        <Clock3 size={14} />
                        {item.duration}
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={() => toggleComplete(index)}
                      className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                        isCompleted
                          ? "border border-green-500/20 bg-green-500/10 text-green-400"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {isCompleted
                        ? "Completed ✓"
                        : "Mark Complete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI Plan Notice */}
        <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/[0.05] p-6">
          <h2 className="text-lg font-semibold">
            🤖 AI-Powered Study Plan
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Once your syllabus is analyzed, Learnova AI can use your
            subjects and topics to create a more personalized study
            plan.
          </p>
        </section>
      </div>
    </div>
  );
}