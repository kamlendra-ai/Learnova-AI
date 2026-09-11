"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
  X,
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

export default function SyllabusPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  function validateFile(selectedFile: File) {
    setError("");
    setResult(null);

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
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      validateFile(selectedFile);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      validateFile(droppedFile);
    }
  }

  function removeFile() {
    setFile(null);
    setResult(null);
    setError("");
  }

  async function analyzeSyllabus() {
    if (!file) {
      setError("Please select a syllabus first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/syllabus/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Syllabus analysis failed.");
      }

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
  }

  return (
    <div className="min-h-screen bg-[#07070a] px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
            <Sparkles className="text-violet-400" size={24} />
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">
            Upload Your Syllabus
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Upload your syllabus and let Learnova AI analyze your subjects,
            units, topics, difficulty levels, and important concepts.
          </p>
        </div>

        {/* Upload */}
        {!result && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
            {!file ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-white/10 hover:border-violet-500/40"
                }`}
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                  <Upload className="text-violet-400" size={30} />
                </div>

                <h2 className="text-xl font-semibold">
                  Drop your syllabus here
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  or choose a file from your computer
                </p>

                <label className="mt-6 cursor-pointer rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200">
                  Choose File

                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-5 text-xs text-zinc-600">
                  PDF / DOCX • Maximum 10 MB
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                      <FileText className="text-violet-400" size={24} />
                    </div>

                    <div>
                      <h2 className="font-semibold">{file.name}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={analyzeSyllabus}
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  {loading ? "AI is analyzing..." : "Analyze with Learnova AI"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* AI Result */}
        {result?.analysis && (
          <section className="mt-8">
            {/* Course overview */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={17} />
                    AI Analysis Complete
                  </div>

                  <h2 className="mt-3 text-3xl font-bold">
                    {result.analysis.course_name}
                  </h2>

                  <p className="mt-2 text-zinc-400">
                    Level: {result.analysis.course_level}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-violet-500/10 px-5 py-4">
                  <BookOpen className="text-violet-400" />
                  <div>
                    <p className="text-2xl font-bold">
                      {result.analysis.units.length}
                    </p>
                    <p className="text-xs text-zinc-500">Units detected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Topics */}
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <h2 className="text-xl font-semibold">
                Important Topics
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {result.analysis.important_topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Units */}
            <div className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">
                Course Units
              </h2>

              <div className="space-y-4">
                {result.analysis.units.map((unit) => (
                  <div
                    key={unit.unit}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-violet-400">
                          Unit {unit.unit}
                        </p>

                        <h3 className="mt-1 text-xl font-semibold">
                          {unit.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                          {unit.difficulty}
                        </span>

                        {unit.important && (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                            Important
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 md:grid-cols-2">
                      {unit.topics.map((topic) => (
                        <div
                          key={topic}
                          className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                        >
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next action */}
            <div className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 text-center md:p-8">
              <h2 className="text-2xl font-bold">
                Your syllabus is ready 🎓
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
                Next, Learnova AI can use these topics to create a
                personalized study plan.
              </p>

              <button
                type="button"
                className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                Generate Study Plan →
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}