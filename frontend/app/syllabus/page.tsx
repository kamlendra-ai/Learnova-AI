"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Star,
  CalendarDays,
  Clock3,
  Target,
  Loader2,
  ArrowLeft,
  Lightbulb,
  CircleCheck,
  Brain,
  RotateCcw,
} from "lucide-react";

type Unit = {
  unit: number;
  title: string;
  topics: string[];
  difficulty: string;
  important: boolean;
};

type Analysis = {
  course_name: string;
  course_level: string;
  units: Unit[];
  important_topics: string[];
};

type ApiResponse = {
  message: string;
  filename: string;
  status: string;
  analysis: Analysis;
};

type DailyPlan = {
  day: number;
  focus: string;
  topics: string[];
  estimated_hours: number;
  activity: string;
  priority: string;
};

type StudyPlanData = {
  course_name: string;
  duration_days: number;
  daily_plan: DailyPlan[];
};

type StudyPlanResponse = {
  message: string;
  status: string;
  study_plan: StudyPlanData;
};

type LessonStep = {
  title: string;
  description: string;
};

type LessonExample = {
  example: string;
  explanation: string;
};

type Lesson = {
  topic: string;
  introduction: string;
  definition: string;
  detailed_explanation: string;
  how_it_works: LessonStep[];
  real_world_examples: LessonExample[];
  important_concepts: LessonStep[];
  practical_example: string;
  advantages: string[];
  limitations: string[];
  common_mistakes: string[];
  exam_interview_points: string[];
  quick_revision: string[];
  practice_questions: string[];
};

type LessonResponse = {
  message: string;
  status: string;
  lesson: Lesson;
};


type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

type Quiz = {
  title: string;
  questions: QuizQuestion[];
};

type QuizResponse = {
  message: string;
  status: string;
  quiz: Quiz;
};

export default function SyllabusPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("Reading syllabus");

  const [error, setError] = useState("");
  const [studyPlanError, setStudyPlanError] = useState("");
  const [lessonError, setLessonError] = useState("");

  const [result, setResult] = useState<ApiResponse | null>(null);
  const [studyPlan, setStudyPlan] =
    useState<StudyPlanResponse | null>(null);

  const [selectedTopic, setSelectedTopic] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const [completedTopics, setCompletedTopics] =
    useState<string[]>([]);

  const [planDays, setPlanDays] = useState(30);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const validateFile = (selectedFile: File) => {
    setError("");
    setResult(null);
    setStudyPlan(null);
    setStudyPlanError("");
    setLesson(null);
    setSelectedTopic("");
    setLessonError("");
    setCompletedTopics([]);
    setQuiz(null);
    setQuizError("");
    setSelectedAnswers({});
    setQuizSubmitted(false);

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    if (selectedFile.size > maxSize) {
      setError("File size must be less than 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      validateFile(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError("");
    setResult(null);
    setStudyPlan(null);
    setStudyPlanError("");
    setLesson(null);
    setSelectedTopic("");
    setLessonError("");
    setCompletedTopics([]);
    setQuiz(null);
    setQuizError("");
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const analyzeSyllabus = async () => {
    if (!file) {
      setError("Please select a syllabus first.");
      return;
    }

    setLoading(true);
    setAnalysisProgress(5);
    setAnalysisStage("Reading syllabus");
    setError("");
    setResult(null);
    setStudyPlan(null);
    setStudyPlanError("");
    setLesson(null);
    setSelectedTopic("");
    setLessonError("");
    setCompletedTopics([]);
    setQuiz(null);
    setQuizError("");
    setSelectedAnswers({});
    setQuizSubmitted(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/syllabus/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Syllabus analysis failed."
        );
      }

      setAnalysisProgress(100);
      setAnalysisStage("Analysis complete");
      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to Learnova AI backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) return;

    const stages = [
      [15, "Reading syllabus", 400],
      [30, "Extracting topics", 1100],
      [50, "Understanding units", 2200],
      [70, "Structuring analysis", 3500],
      [85, "Finalizing analysis", 5000],
    ] as const;

    const timers = stages.map(([progress, stage, delay]) =>
      window.setTimeout(() => {
        setAnalysisProgress((current) => Math.max(current, progress));
        setAnalysisStage(stage);
      }, delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [loading]);

  const generateStudyPlan = async () => {
    if (!result?.analysis) {
      setStudyPlanError(
        "Please analyze your syllabus first."
      );
      return;
    }

    setStudyPlanLoading(true);
    setStudyPlanError("");
    setStudyPlan(null);
    setLesson(null);
    setSelectedTopic("");
    setLessonError("");
    setCompletedTopics([]);
    setQuiz(null);
    setQuizError("");
    setSelectedAnswers({});
    setQuizSubmitted(false);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/syllabus/study-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            course_name: result.analysis.course_name,
            course_level: result.analysis.course_level,
            units: result.analysis.units,
            days: planDays,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Study plan generation failed."
        );
      }

      setStudyPlan(data);
    } catch (error) {
      setStudyPlanError(
        error instanceof Error
          ? error.message
          : "Unable to generate study plan."
      );
    } finally {
      setStudyPlanLoading(false);
    }
  };

  const openTopicLesson = async (topic: string) => {
    if (!result?.analysis) {
      return;
    }

    setSelectedTopic(topic);
    setLesson(null);
    setLessonError("");
    setLessonLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/syllabus/lesson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            course_name: result.analysis.course_name,
            course_level: result.analysis.course_level,
            topic,
          }),
        }
      );

      const data: LessonResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as unknown as { detail?: string }).detail ||
            "Lesson generation failed."
        );
      }

      setLesson(data.lesson);
    } catch (error) {
      setLessonError(
        error instanceof Error
          ? error.message
          : "Unable to generate this lesson."
      );
    } finally {
      setLessonLoading(false);
    }
  };


  const generateQuiz = async (topics: string[]) => {
    if (!result?.analysis) {
      setQuizError("Please analyze your syllabus first.");
      return;
    }

    if (!topics.length) {
      setQuizError("No topics are available for this quiz.");
      return;
    }

    setQuizLoading(true);
    setQuizError("");
    setQuiz(null);
    setSelectedAnswers({});
    setQuizSubmitted(false);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/syllabus/quiz",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            course_name: result.analysis.course_name,
            course_level: result.analysis.course_level,
            topics,
          }),
        }
      );

      const data: QuizResponse | { detail?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          (data as { detail?: string }).detail ||
            "Quiz generation failed."
        );
      }

      setQuiz((data as QuizResponse).quiz);
    } catch (error) {
      setQuizError(
        error instanceof Error
          ? error.message
          : "Unable to generate quiz."
      );
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = () => {
    if (!quiz) {
      return;
    }

    setQuizSubmitted(true);
  };

  const getQuizScore = () => {
    if (!quiz) {
      return 0;
    }

    return quiz.questions.reduce((score, question, index) => {
      return (
        score +
        (selectedAnswers[index] === question.correct_answer
          ? 1
          : 0)
      );
    }, 0);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizError("");
  };

  const toggleTopicComplete = (topic: string) => {
    setCompletedTopics((current) => {
      if (current.includes(topic)) {
        return current.filter((item) => item !== topic);
      }

      return [...current, topic];
    });
  };

  const closeLesson = () => {
    setLesson(null);
    setSelectedTopic("");
    setLessonError("");
  };

  const isTopicComplete = (topic: string) => {
    return completedTopics.includes(topic);
  };

  const getDayProgress = (day: DailyPlan) => {
    const completed = day.topics.filter((topic) =>
      completedTopics.includes(topic)
    ).length;

    return {
      completed,
      total: day.topics.length,
      percentage:
        day.topics.length > 0
          ? Math.round(
              (completed / day.topics.length) * 100
            )
          : 0,
    };
  };

  return (
    <div className="min-h-screen bg-[#07070a] px-6 py-10 text-white md:px-10">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
            <Sparkles
              className="text-violet-400"
              size={26}
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Upload Your Syllabus
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Upload your syllabus and let Learnova AI understand
            your subjects, units, topics, and important concepts.
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl md:p-8">
            {!file ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-white/10 bg-black/20 hover:border-violet-500/40 hover:bg-white/[0.03]"
                }`}
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                  <Upload
                    className="text-violet-400"
                    size={30}
                  />
                </div>

                <h2 className="text-xl font-semibold">
                  Drop your syllabus here
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  or choose a file from your computer
                </p>

                <label className="mt-6 cursor-pointer rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                  Choose File

                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-zinc-500">
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    PDF
                  </span>

                  <span className="rounded-full border border-white/10 px-3 py-1">
                    DOCX
                  </span>

                  <span className="rounded-full border border-white/10 px-3 py-1">
                    Max 10 MB
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                      <FileText
                        className="text-red-400"
                        size={23}
                      />
                    </div>

                    <div>
                      <h2 className="max-w-md truncate font-semibold">
                        {file.name}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
                    aria-label="Remove file"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 size={18} />
                  File ready for analysis
                </div>

                <button
                  type="button"
                  onClick={analyzeSyllabus}
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={18} />
                          <span>AI is analyzing...</span>
                        </div>
                        <span className="font-bold">{analysisProgress}%</span>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-700"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>

                      <p className="mt-3 text-left text-xs text-zinc-400">
                        {analysisStage}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-left text-xs sm:grid-cols-2">
                        {[
                          [15, "Reading syllabus"],
                          [30, "Extracting topics"],
                          [50, "Understanding units"],
                          [70, "Structuring analysis"],
                          [85, "Finalizing analysis"],
                          [100, "Analysis complete"],
                        ].map(([progress, label]) => (
                          <div
                            key={label}
                            className={`flex items-center justify-between rounded-lg px-2 py-1 ${
                              analysisProgress >= progress 
                                ? "text-emerald-400"
                                : "text-zinc-600"
                            }`}
                          >
                            <span>
                              {analysisProgress >= progress ? "✓" : "○"} {label}
                            </span>

                            <span className="font-semibold">
                              {progress}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analyze with Learnova AI
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Analysis Result */}
        {result?.analysis && !studyPlan && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={18} />
                    AI Analysis Complete
                  </div>

                  <h2 className="text-3xl font-bold">
                    {result.analysis.course_name}
                  </h2>

                  <p className="mt-2 text-zinc-400">
                    Level: {result.analysis.course_level}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-6 py-4">
                  <BookOpen
                    className="text-violet-400"
                    size={28}
                  />

                  <div>
                    <p className="text-2xl font-bold">
                      {result.analysis.units.length}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Units detected
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Important Topics */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
              <div className="flex items-center gap-2">
                <Star
                  className="text-amber-400"
                  size={20}
                />

                <h2 className="text-xl font-semibold">
                  Important Topics
                </h2>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {result.analysis.important_topics.map(
                  (topic) => (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => openTopicLesson(topic)}
                      className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition hover:border-violet-400/50 hover:bg-violet-500/20"
                    >
                      {topic}
                    </button>
                  )
                )}
              </div>
            </section>

            {/* Units */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">
                Course Units
              </h2>

              <div className="space-y-4">
                {result.analysis.units.map((unit) => (
                  <div
                    key={unit.unit}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-violet-400">
                          Unit {unit.unit}
                        </p>

                        <h3 className="mt-1 text-xl font-semibold">
                          {unit.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                          {unit.difficulty}
                        </span>

                        {unit.important && (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                            ⭐ Important
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 md:grid-cols-2">
                      {unit.topics.map((topic) => (
                        <button
                          type="button"
                          key={topic}
                          onClick={() =>
                            openTopicLesson(topic)
                          }
                          className="group rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{topic}</span>

                            <BookOpen
                              size={16}
                              className="shrink-0 text-violet-400 opacity-0 transition group-hover:opacity-100"
                            />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Study Plan Generator */}
            <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="text-violet-400"
                      size={22}
                    />

                    <h2 className="text-2xl font-bold">
                      Create Your Study Plan
                    </h2>
                  </div>

                  <p className="mt-2 max-w-xl text-sm text-zinc-400">
                    Let Learnova AI organize these topics into a
                    personalized daily learning schedule.
                  </p>
                </div>

                <div className="min-w-[180px]">
                  <label className="mb-2 block text-sm text-zinc-400">
                    Plan duration
                  </label>

                  <select
                    value={planDays}
                    onChange={(event) =>
                      setPlanDays(Number(event.target.value))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  >
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              </div>

              {studyPlanError && (
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                  <AlertCircle size={18} />
                  {studyPlanError}
                </div>
              )}

              <button
                type="button"
                onClick={generateStudyPlan}
                disabled={studyPlanLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {studyPlanLoading ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      size={18}
                    />
                    Creating your study plan...
                  </>
                ) : (
                  <>
                    <CalendarDays size={18} />
                    Generate Study Plan
                  </>
                )}
              </button>
            </section>
          </div>
        )}

        {/* Study Plan */}
        {studyPlan?.study_plan && (
          <div className="space-y-6">
            {/* Plan Header */}
            <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={18} />
                    Study Plan Generated
                  </div>

                  <h2 className="mt-3 text-3xl font-bold">
                    {studyPlan.study_plan.course_name}
                  </h2>

                  <p className="mt-2 text-zinc-400">
                    Your personalized{" "}
                    {studyPlan.study_plan.duration_days}-day
                    learning roadmap
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4">
                  <CalendarDays
                    className="text-emerald-400"
                    size={28}
                  />

                  <div>
                    <p className="text-2xl font-bold">
                      {studyPlan.study_plan.duration_days}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Days
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Daily Plan */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">
                Your Daily Study Plan
              </h2>

              <div className="space-y-4">
                {studyPlan.study_plan.daily_plan.map(
                  (day) => {
                    const progress = getDayProgress(day);
                    const dayComplete =
                      progress.completed === progress.total &&
                      progress.total > 0;

                    return (
                      <div
                        key={day.day}
                        className={`rounded-3xl border p-6 backdrop-blur-xl transition ${
                          dayComplete
                            ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                            : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex flex-col gap-5 md:flex-row">
                          {/* Day */}
                          <div
                            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                              dayComplete
                                ? "bg-emerald-500/10"
                                : "bg-violet-500/10"
                            }`}
                          >
                            <div className="text-center">
                              <p
                                className={`text-xs ${
                                  dayComplete
                                    ? "text-emerald-400"
                                    : "text-violet-400"
                                }`}
                              >
                                DAY
                              </p>

                              <p className="text-xl font-bold">
                                {day.day}
                              </p>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-semibold">
                                    {day.focus}
                                  </h3>

                                  {dayComplete && (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                      <CheckCircle2
                                        size={13}
                                      />
                                      Day Complete
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-sm text-zinc-500">
                                  Activity: {day.activity}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                                  <Clock3 size={13} />
                                  {day.estimated_hours} hrs
                                </span>

                                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                                  <Target size={13} />
                                  {day.priority}
                                </span>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="mt-5 rounded-2xl border border-white/5 bg-black/20 p-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">
                                  Day Progress
                                </span>

                                <span
                                  className={
                                    dayComplete
                                      ? "font-semibold text-emerald-400"
                                      : "text-zinc-500"
                                  }
                                >
                                  {progress.completed}/
                                  {progress.total} topics
                                </span>
                              </div>

                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    dayComplete
                                      ? "bg-emerald-500"
                                      : "bg-violet-500"
                                  }`}
                                  style={{
                                    width: `${progress.percentage}%`,
                                  }}
                                />
                              </div>

                              <p className="mt-2 text-xs text-zinc-600">
                                {progress.percentage}% complete
                              </p>
                            </div>

                            {/* Topics */}
                            <div className="mt-5 grid gap-2 md:grid-cols-2">
                              {day.topics.map((topic) => {
                                const complete =
                                  isTopicComplete(topic);

                                return (
                                  <div
                                    key={topic}
                                    className={`rounded-xl border p-3 transition ${
                                      complete
                                        ? "border-emerald-500/20 bg-emerald-500/5"
                                        : "border-white/5 bg-black/20"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openTopicLesson(topic)
                                        }
                                        className="group flex min-w-0 flex-1 items-center gap-2 text-left text-sm transition hover:text-violet-300"
                                      >
                                        {complete ? (
                                          <CheckCircle2
                                            size={17}
                                            className="shrink-0 text-emerald-400"
                                          />
                                        ) : (
                                          <BookOpen
                                            size={17}
                                            className="shrink-0 text-violet-400"
                                          />
                                        )}

                                        <span
                                          className={
                                            complete
                                              ? "text-emerald-300 line-through decoration-emerald-500/40"
                                              : "text-zinc-300"
                                          }
                                        >
                                          {topic}
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleTopicComplete(
                                            topic
                                          )
                                        }
                                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                          complete
                                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                            : "bg-white/5 text-zinc-500 hover:bg-violet-500/10 hover:text-violet-300"
                                        }`}
                                      >
                                        {complete
                                          ? "Completed"
                                          : "Mark Done"}
                                      </button>
                                    </div>

                                    {!complete && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openTopicLesson(topic)
                                        }
                                        className="mt-2 pl-6 text-xs text-violet-400 transition hover:text-violet-300"
                                      >
                                        Open lesson →
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Quiz Actions */}
                            <div className="mt-5 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row">
                              <button
                                type="button"
                                onClick={() =>
                                  generateQuiz(day.topics)
                                }
                                disabled={quizLoading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {quizLoading ? (
                                  <>
                                    <Loader2
                                      className="animate-spin"
                                      size={17}
                                    />
                                    Generating Quiz...
                                  </>
                                ) : (
                                  <>
                                    <Brain size={17} />
                                    Generate Quiz
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  generateQuiz(
                                    day.topics
                                  )
                                }
                                disabled={quizLoading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Star size={17} />
                                Practice Important Topics
                              </button>
                            </div>

                            {quizError && (
                              <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                                <AlertCircle size={17} />
                                {quizError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* Overall Progress */}
            <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 md:p-8">
              {(() => {
                const allTopics =
                  studyPlan.study_plan.daily_plan.flatMap(
                    (day) => day.topics
                  );

                const completedCount = allTopics.filter(
                  (topic) =>
                    completedTopics.includes(topic)
                ).length;

                const percentage =
                  allTopics.length > 0
                    ? Math.round(
                        (completedCount / allTopics.length) *
                          100
                      )
                    : 0;

                return (
                  <>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          Overall Learning Progress
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                          Keep learning topic by topic.
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-violet-400">
                        {percentage}%
                      </p>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-sm text-zinc-500">
                      {completedCount} of{" "}
                      {allTopics.length} topics completed
                    </p>
                  </>
                );
              })()}
            </section>

            {/* Completion */}
            <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
              <Sparkles
                className="mx-auto text-violet-400"
                size={30}
              />

              <h2 className="mt-4 text-2xl font-bold">
                Your learning roadmap is ready 🎓
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
                Follow your daily plan consistently and track your
                progress inside Learnova AI.
              </p>
            </section>
          </div>
        )}


        {/* Quiz Modal */}
        {quiz && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#07070a]/95 px-4 py-8 backdrop-blur-md md:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setQuiz(null);
                    setQuizSubmitted(false);
                    setSelectedAnswers({});
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <ArrowLeft size={17} />
                  Back to Study Plan
                </button>

                {quizSubmitted && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400">
                    Score: {getQuizScore()}/{quiz.questions.length}
                  </div>
                )}
              </div>

              <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-7 shadow-2xl md:p-10">
                <div className="flex items-center gap-3 text-violet-400">
                  <Brain size={25} />
                  <span className="text-sm font-medium">
                    Learnova AI Quiz
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold md:text-4xl">
                  {quiz.title}
                </h1>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Test your understanding of today's topics.
                  Choose the best answer for every question.
                </p>
              </section>

              <div className="mt-6 space-y-5">
                {quiz.questions.map((question, questionIndex) => {
                  const selected =
                    selectedAnswers[questionIndex];

                  return (
                    <section
                      key={`${question.question}-${questionIndex}`}
                      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-400">
                          {questionIndex + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-semibold leading-7 text-white">
                            {question.question}
                          </h2>

                          <div className="mt-5 space-y-3">
                            {question.options.map((option) => {
                              const isSelected =
                                selected === option;
                              const isCorrect =
                                question.correct_answer ===
                                option;

                              let optionClass =
                                "border-white/10 bg-black/20 hover:border-violet-500/30 hover:bg-violet-500/5";

                              if (
                                quizSubmitted &&
                                isCorrect
                              ) {
                                optionClass =
                                  "border-emerald-500/30 bg-emerald-500/10";
                              } else if (
                                quizSubmitted &&
                                isSelected &&
                                !isCorrect
                              ) {
                                optionClass =
                                  "border-red-500/30 bg-red-500/10";
                              } else if (isSelected) {
                                optionClass =
                                  "border-violet-500/40 bg-violet-500/10";
                              }

                              return (
                                <button
                                  type="button"
                                  key={option}
                                  disabled={quizSubmitted}
                                  onClick={() =>
                                    setSelectedAnswers(
                                      (current) => ({
                                        ...current,
                                        [questionIndex]:
                                          option,
                                      })
                                    )
                                  }
                                  className={`w-full rounded-2xl border p-4 text-left text-sm transition ${optionClass} disabled:cursor-default`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                                        isSelected
                                          ? "border-violet-400 bg-violet-500/20 text-violet-300"
                                          : "border-white/10 text-zinc-500"
                                      }`}
                                    >
                                      {String.fromCharCode(
                                        65 +
                                          question.options.indexOf(
                                            option
                                          )
                                      )}
                                    </span>

                                    <span className="text-zinc-300">
                                      {option}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div
                              className={`mt-4 rounded-2xl border p-4 ${
                                selected ===
                                question.correct_answer
                                  ? "border-emerald-500/20 bg-emerald-500/5"
                                  : "border-red-500/20 bg-red-500/5"
                              }`}
                            >
                              <p
                                className={`text-sm font-semibold ${
                                  selected ===
                                  question.correct_answer
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {selected ===
                                question.correct_answer
                                  ? "✓ Correct"
                                  : "✗ Incorrect"}
                              </p>

                              {selected !==
                                question.correct_answer && (
                                <p className="mt-2 text-sm text-zinc-400">
                                  Correct answer:{" "}
                                  <span className="font-medium text-emerald-400">
                                    {question.correct_answer}
                                  </span>
                                </p>
                              )}

                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
                {!quizSubmitted ? (
                  <>
                    <p className="text-sm text-zinc-500">
                      Answer all questions, then submit your quiz.
                    </p>

                    <button
                      type="button"
                      onClick={submitQuiz}
                      disabled={
                        Object.keys(selectedAnswers).length !==
                        quiz.questions.length
                      }
                      className="mt-5 rounded-xl bg-violet-600 px-7 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Submit Quiz
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-400">
                      Your final score
                    </p>

                    <p className="mt-2 text-4xl font-bold text-violet-400">
                      {getQuizScore()}/{quiz.questions.length}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {getQuizScore() ===
                      quiz.questions.length
                        ? "Perfect score! Excellent work 🎉"
                        : getQuizScore() >= 3
                          ? "Good job! Keep practicing 💪"
                          : "Keep learning and try again 📚"}
                    </p>

                    <button
                      type="button"
                      onClick={resetQuiz}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <RotateCcw size={16} />
                      Retry Quiz
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Lesson */}
        {selectedTopic && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#07070a]/95 px-4 py-8 backdrop-blur-md md:px-8">
            <div className="mx-auto max-w-5xl">
              <button
                type="button"
                onClick={closeLesson}
                className="mb-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft size={17} />
                Back
              </button>

              {lessonLoading && (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10">
                    <Loader2
                      className="animate-spin text-violet-400"
                      size={36}
                    />
                  </div>

                  <h2 className="text-2xl font-bold">
                    Preparing your lesson...
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                    Learnova AI is creating a detailed lesson for:
                  </p>

                  <p className="mt-2 text-lg font-semibold text-violet-300">
                    {selectedTopic}
                  </p>
                </div>
              )}

              {!lessonLoading && lessonError && (
                <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                  <AlertCircle
                    className="mx-auto text-red-400"
                    size={36}
                  />

                  <h2 className="mt-4 text-xl font-bold">
                    Could not generate lesson
                  </h2>

                  <p className="mt-2 text-sm text-red-300">
                    {lessonError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      openTopicLesson(selectedTopic)
                    }
                    className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!lessonLoading && lesson && (
                <article className="space-y-6 pb-12">
                  <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-7 shadow-2xl md:p-10">
                    <div className="flex items-center gap-2 text-sm text-violet-400">
                      <BookOpen size={18} />
                      Learn with Learnova AI
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                      {lesson.topic}
                    </h1>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                      A detailed, beginner-friendly lesson generated
                      specifically for your study plan.
                    </p>
                  </section>

                  <LessonSection
                    icon={<Sparkles size={20} />}
                    title="Introduction"
                  >
                    <p className="whitespace-pre-line text-sm leading-7 text-zinc-300 md:text-base">
                      {lesson.introduction}
                    </p>
                  </LessonSection>

                  <LessonSection
                    icon={<Lightbulb size={20} />}
                    title="Simple Definition"
                  >
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                      <p className="text-base font-medium leading-7 text-violet-100 md:text-lg">
                        {lesson.definition}
                      </p>
                    </div>
                  </LessonSection>

                  <LessonSection
                    icon={<BookOpen size={20} />}
                    title="Detailed Explanation"
                  >
                    <p className="whitespace-pre-line text-sm leading-7 text-zinc-300 md:text-base">
                      {lesson.detailed_explanation}
                    </p>
                  </LessonSection>

                  {lesson.how_it_works?.length > 0 && (
                    <LessonSection
                      icon={<Target size={20} />}
                      title="How It Works"
                    >
                      <div className="space-y-3">
                        {lesson.how_it_works.map(
                          (item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-5"
                            >
                              <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-400">
                                  {index + 1}
                                </div>

                                <div>
                                  <h3 className="font-semibold text-white">
                                    {item.title}
                                  </h3>

                                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </LessonSection>
                  )}

                  {lesson.real_world_examples?.length > 0 && (
                    <LessonSection
                      icon={<Star size={20} />}
                      title="Real-World Examples"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        {lesson.real_world_examples.map(
                          (item, index) => (
                            <div
                              key={`${item.example}-${index}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-5"
                            >
                              <h3 className="font-semibold text-white">
                                {item.example}
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {item.explanation}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </LessonSection>
                  )}

                  {lesson.important_concepts?.length > 0 && (
                    <LessonSection
                      icon={<Lightbulb size={20} />}
                      title="Important Concepts"
                    >
                      <div className="space-y-3">
                        {lesson.important_concepts.map(
                          (item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-5"
                            >
                              <h3 className="font-semibold text-white">
                                {item.title}
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {item.description}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </LessonSection>
                  )}

                  <LessonSection
                    icon={<Target size={20} />}
                    title="Practical Example"
                  >
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                      <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">
                        {lesson.practical_example}
                      </p>
                    </div>
                  </LessonSection>

                  {lesson.advantages?.length > 0 && (
                    <LessonSection
                      icon={<CircleCheck size={20} />}
                      title="Advantages"
                    >
                      <BulletList items={lesson.advantages} />
                    </LessonSection>
                  )}

                  {lesson.limitations?.length > 0 && (
                    <LessonSection
                      icon={<AlertCircle size={20} />}
                      title="Limitations"
                    >
                      <BulletList items={lesson.limitations} />
                    </LessonSection>
                  )}

                  {lesson.common_mistakes?.length > 0 && (
                    <LessonSection
                      icon={<AlertCircle size={20} />}
                      title="Common Mistakes"
                    >
                      <BulletList
                        items={lesson.common_mistakes}
                      />
                    </LessonSection>
                  )}

                  {lesson.exam_interview_points?.length > 0 && (
                    <LessonSection
                      icon={<Star size={20} />}
                      title="Exam & Interview Points"
                    >
                      <BulletList
                        items={lesson.exam_interview_points}
                      />
                    </LessonSection>
                  )}

                  {lesson.quick_revision?.length > 0 && (
                    <LessonSection
                      icon={<CheckCircle2 size={20} />}
                      title="Quick Revision"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        {lesson.quick_revision.map(
                          (item, index) => (
                            <div
                              key={`${item}-${index}`}
                              className="flex gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4"
                            >
                              <CheckCircle2
                                size={18}
                                className="mt-0.5 shrink-0 text-emerald-400"
                              />

                              <p className="text-sm leading-6 text-zinc-300">
                                {item}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </LessonSection>
                  )}

                  {lesson.practice_questions?.length > 0 && (
                    <LessonSection
                      icon={<BookOpen size={20} />}
                      title="Practice Questions"
                    >
                      <div className="space-y-3">
                        {lesson.practice_questions.map(
                          (question, index) => (
                            <div
                              key={`${question}-${index}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-5"
                            >
                              <p className="text-sm font-medium leading-6 text-zinc-200">
                                <span className="mr-2 text-violet-400">
                                  Q{index + 1}.
                                </span>
                                {question}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </LessonSection>
                  )}

                  {/* Mark Complete */}
                  <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                    {isTopicComplete(lesson.topic) ? (
                      <>
                        <CheckCircle2
                          className="mx-auto text-emerald-400"
                          size={40}
                        />

                        <h2 className="mt-4 text-2xl font-bold">
                          Topic Completed 🎉
                        </h2>

                        <p className="mt-2 text-sm text-zinc-400">
                          You have marked this topic as complete.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            toggleTopicComplete(lesson.topic)
                          }
                          className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08]"
                        >
                          Mark as Incomplete
                        </button>
                      </>
                    ) : (
                      <>
                        <CircleCheck
                          className="mx-auto text-violet-400"
                          size={40}
                        />

                        <h2 className="mt-4 text-2xl font-bold">
                          Finished this topic?
                        </h2>

                        <p className="mt-2 text-sm text-zinc-400">
                          Mark it complete to update your daily
                          learning progress.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            toggleTopicComplete(lesson.topic)
                          }
                          className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                        >
                          ✓ Mark Topic Complete
                        </button>
                      </>
                    )}
                  </section>
                </article>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LessonSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
          {icon}
        </div>

        <h2 className="text-xl font-bold md:text-2xl">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function BulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />

          <p className="text-sm leading-6 text-zinc-300">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}