"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";

const questions = [
  {
    question: "What is Artificial Intelligence?",
    options: [
      "A type of computer hardware",
      "Technology that enables machines to perform intelligent tasks",
      "A programming language",
      "A database system",
    ],
    answer: 1,
  },
  {
    question: "What does ML stand for?",
    options: [
      "Machine Learning",
      "Modern Logic",
      "Machine Language",
      "Model Logic",
    ],
    answer: 0,
  },
  {
    question: "Which of these is commonly used for data analysis?",
    options: ["Python", "HTML", "CSS", "XML"],
    answer: 0,
  },
  {
    question: "What is a dataset?",
    options: [
      "A programming language",
      "A collection of data",
      "A computer processor",
      "A web browser",
    ],
    answer: 1,
  },
  {
    question: "What is the purpose of a quiz?",
    options: [
      "To test understanding",
      "To delete data",
      "To install software",
      "To create hardware",
    ],
    answer: 0,
  },
];

export default function TestsPage() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function handleAnswer(index: number) {
    if (selected !== null) return;

    setSelected(index);

    if (index === questions[current].answer) {
      setScore((prev) => prev + 1);
    }
  }

  function nextQuestion() {
    if (selected === null) return;

    if (current === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
    setSelected(null);
  }

  function restartQuiz() {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  const question = questions[current];

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
            <ClipboardCheck
              size={25}
              className="text-violet-400"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold md:text-4xl">
            Tests & Quizzes
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400 md:text-base">
            Test your knowledge and track your understanding.
          </p>
        </header>

        {!finished ? (
          <div className="mx-auto max-w-3xl">
            {/* Progress */}
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-zinc-400">
                  Question {current + 1} of {questions.length}
                </span>

                <span className="text-violet-400">
                  Score: {score}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{
                    width: `${((current + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
              <p className="text-sm font-medium text-violet-400">
                Question {current + 1}
              </p>

              <h2 className="mt-3 text-xl font-semibold leading-8 md:text-2xl">
                {question.question}
              </h2>

              <div className="mt-6 space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selected === index;
                  const isCorrect =
                    index === question.answer;

                  let className =
                    "border-white/10 bg-white/[0.03] hover:border-violet-500/40";

                  if (selected !== null) {
                    if (isCorrect) {
                      className =
                        "border-green-500/30 bg-green-500/10";
                    } else if (isSelected) {
                      className =
                        "border-red-500/30 bg-red-500/10";
                    }
                  } else if (isSelected) {
                    className =
                      "border-violet-500/40 bg-violet-500/10";
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAnswer(index)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${className}`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span className="flex-1 text-sm text-zinc-300">
                        {option}
                      </span>

                      {selected !== null &&
                        isCorrect && (
                          <CheckCircle2
                            size={19}
                            className="text-green-400"
                          />
                        )}

                      {selected !== null &&
                        isSelected &&
                        !isCorrect && (
                          <XCircle
                            size={19}
                            className="text-red-400"
                          />
                        )}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                type="button"
                disabled={selected === null}
                onClick={nextQuestion}
                className="mt-6 w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {current === questions.length - 1
                  ? "Finish Test"
                  : "Next Question →"}
              </button>
            </div>
          </div>
        ) : (
          /* Result */
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
              <Trophy
                size={32}
                className="text-violet-400"
              />
            </div>

            <h2 className="mt-6 text-3xl font-bold">
              Test Completed 🎉
            </h2>

            <p className="mt-3 text-zinc-400">
              You scored
            </p>

            <p className="mt-2 text-5xl font-bold text-violet-400">
              {score}/{questions.length}
            </p>

            <p className="mt-4 text-sm text-zinc-500">
              Keep learning and improve your score with
              Learnova AI.
            </p>

            <button
              type="button"
              onClick={restartQuiz}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <RotateCcw size={17} />
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}