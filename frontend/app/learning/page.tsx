"use client";

import { useState } from "react";
import {
  Brain,
  BookOpen,
  CheckCircle2,
  Clock3,
  Play,
  ChevronRight,
} from "lucide-react";

const topics = [
  {
    title: "Introduction to the Subject",
    description:
      "Understand the basic concepts and build a strong foundation.",
    duration: "20 min",
  },
  {
    title: "Core Concepts",
    description:
      "Learn the important concepts required for deeper understanding.",
    duration: "35 min",
  },
  {
    title: "Important Topics",
    description:
      "Focus on the high-priority topics from your syllabus.",
    duration: "40 min",
  },
  {
    title: "Practice Questions",
    description:
      "Apply your knowledge with practice questions.",
    duration: "30 min",
  },
];

export default function LearningPage() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [activeTopic, setActiveTopic] = useState<number | null>(null);

  function toggleComplete(index: number) {
    setCompleted((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  }

  const progress = Math.round(
    (completed.length / topics.length) * 100
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
            <Brain
              size={25}
              className="text-violet-400"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            AI Learning
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Learn your syllabus step by step with AI-powered lessons,
            explanations and practice.
          </p>
        </header>

        {/* Progress */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Learning Progress
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {completed.length} of {topics.length} topics completed
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold text-violet-400">
                {progress}%
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

        {/* Current Learning */}
        <section className="mb-8 rounded-3xl border border-violet-500/20 bg-violet-500/[0.05] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                <Play size={12} />
                Continue Learning
              </div>

              <h2 className="text-2xl font-bold">
                Build Your Knowledge
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Start with the topics below. Learn each concept,
                practice it, and mark it complete when you are ready.
              </p>
            </div>

            <BookOpen
              size={48}
              className="text-violet-400"
            />
          </div>
        </section>

        {/* Topics */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Learning Topics
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your AI learning journey
            </p>
          </div>

          <div className="space-y-4">
            {topics.map((topic, index) => {
              const isCompleted = completed.includes(index);
              const isActive = activeTopic === index;

              return (
                <div
                  key={topic.title}
                  className={`rounded-2xl border p-5 backdrop-blur-xl transition ${
                    isCompleted
                      ? "border-green-500/20 bg-green-500/[0.04]"
                      : "border-white/10 bg-white/[0.04] hover:border-violet-500/30"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* Number */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-semibold ${
                        isCompleted
                          ? "bg-green-500/10 text-green-400"
                          : "bg-violet-500/10 text-violet-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={21} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Topic */}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {topic.title}
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-zinc-500">
                        {topic.description}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                        <Clock3 size={14} />
                        {topic.duration}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTopic(
                            isActive ? null : index
                          )
                        }
                        className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06]"
                      >
                        {isActive ? "Close" : "Learn"}

                        <ChevronRight
                          size={16}
                          className={
                            isActive
                              ? "rotate-90 transition"
                              : "transition"
                          }
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleComplete(index)
                        }
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                          isCompleted
                            ? "border border-green-500/20 bg-green-500/10 text-green-400"
                            : "bg-white text-black hover:bg-zinc-200"
                        }`}
                      >
                        {isCompleted
                          ? "Completed ✓"
                          : "Complete"}
                      </button>
                    </div>
                  </div>

                  {/* Lesson */}
                  {isActive && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
                        <Brain size={17} />
                        AI Lesson
                      </div>

                      <h4 className="mt-4 text-lg font-semibold">
                        {topic.title}
                      </h4>

                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        This lesson will explain the topic in a
                        simple and structured way. Once the syllabus
                        AI pipeline is connected, this section will
                        automatically contain an AI-generated lesson
                        based on your actual syllabus.
                      </p>

                      <div className="mt-5 rounded-xl border border-violet-500/10 bg-violet-500/[0.04] p-4">
                        <p className="text-xs font-medium text-violet-400">
                          💡 Learning Tip
                        </p>

                        <p className="mt-2 text-sm text-zinc-400">
                          Understand the concept first, then practice
                          questions to strengthen your understanding.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* AI Notice */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">
            🤖 Learnova AI
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Your actual syllabus topics and AI-generated lessons will
            be connected here after syllabus analysis.
          </p>
        </section>
      </div>
    </div>
  );
}