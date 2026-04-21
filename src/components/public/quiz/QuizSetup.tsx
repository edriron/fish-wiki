"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { startQuiz } from "@/app/actions/quiz";
import { QUIZ_FILTER_LABELS } from "@/lib/quiz-labels";
import type {
  QuizDifficulty,
  QuizMode,
  QuizContentType,
  SmartAnswerLevel,
} from "@/types/quiz";
import { SMART_ANSWER_DEFAULTS } from "@/types/quiz";

// ─── difficulty presets ──────────────────────────────────────────────────────

const PRESETS: Record<
  Exclude<QuizDifficulty, "custom">,
  { numQuestions: number; numAnswers: number }
> = {
  easy: { numQuestions: 5, numAnswers: 2 },
  medium: { numQuestions: 10, numAnswers: 4 },
  hard: { numQuestions: 15, numAnswers: 6 },
};

const SMART_ANSWER_OPTIONS: {
  value: SmartAnswerLevel;
  label: string;
  sub: string;
}[] = [
  { value: "easy", label: "Off", sub: "Fully random" },
  { value: "medium", label: "Mild", sub: "25% similar" },
  { value: "hard", label: "Tough", sub: "75% similar" },
  { value: "extreme", label: "Extreme", sub: "100% similar" },
];

const ANSWER_OPTIONS = [2, 4, 6];

// ─── component ───────────────────────────────────────────────────────────────

export function QuizSetup() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Core
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [numQuestions, setNumQuestions] = useState(PRESETS.medium.numQuestions);
  const [numAnswers, setNumAnswers] = useState(PRESETS.medium.numAnswers);
  const [mode, setMode] = useState<QuizMode>("by_image");
  const [contentType, setContentType] = useState<QuizContentType>("fish");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]); // empty = all
  const [smartAnswers, setSmartAnswers] = useState<SmartAnswerLevel>(
    SMART_ANSWER_DEFAULTS.medium,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyDifficulty(d: Exclude<QuizDifficulty, "custom">) {
    setDifficulty(d);
    setNumQuestions(PRESETS[d].numQuestions);
    setNumAnswers(PRESETS[d].numAnswers);
    setSmartAnswers(SMART_ANSWER_DEFAULTS[d]);
  }

  function handleQuestionsChange(value: number) {
    setNumQuestions(value);
    setDifficulty("custom");
  }

  function handleAnswersChange(value: number) {
    setNumAnswers(value);
    setDifficulty("custom");
  }

  function toggleLabel(id: string) {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startQuiz({
        difficulty,
        numQuestions,
        numAnswers,
        mode,
        contentType,
        labelIds: selectedLabels,
        smartAnswers,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/quiz/${result.attemptId}`);
    });
  }

  const difficultyButtons: { key: Exclude<QuizDifficulty, "custom">; label: string; desc: string }[] = [
    { key: "easy", label: "Easy", desc: "5 Q · 2 options" },
    { key: "medium", label: "Medium", desc: "10 Q · 4 options" },
    { key: "hard", label: "Hard", desc: "15 Q · 6 options" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      {/* Difficulty */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Difficulty
        </p>
        <div className="grid grid-cols-3 gap-3">
          {difficultyButtons.map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => applyDifficulty(key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-all",
                (difficulty === key ||
                  (difficulty === "custom" &&
                    numQuestions === PRESETS[key].numQuestions &&
                    numAnswers === PRESETS[key].numAnswers))
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500",
              )}
            >
              <span className="font-semibold text-sm">{label}</span>
              <span className="text-xs opacity-70">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-3.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-medium">Advanced settings</span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showAdvanced && (
        <div className="px-6 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-700 pt-5">
          {/* Number of questions */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
              Questions
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={3}
                max={30}
                value={numQuestions}
                onChange={(e) => handleQuestionsChange(Number(e.target.value))}
                className="flex-1 accent-teal-600"
              />
              <span className="w-8 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                {numQuestions}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>3</span>
              <span>30</span>
            </div>
          </div>

          {/* Answers per question */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
              Options per question
            </label>
            <div className="flex gap-2">
              {ANSWER_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => handleAnswersChange(n)}
                  className={cn(
                    "flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition-all",
                    numAnswers === n
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
              Question mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "by_image", label: "Identify by image", sub: "See photo → pick name" },
                  { value: "by_name", label: "Identify by name", sub: "See name → pick photo" },
                ] as const
              ).map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-all",
                    mode === value
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                  )}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs opacity-70 mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
              Include
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "fish", label: "Fish only" },
                  { value: "plants", label: "Plants only" },
                  { value: "both", label: "Fish & Plants" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setContentType(value)}
                  className={cn(
                    "flex-1 rounded-lg border-2 py-2 text-xs font-semibold transition-all",
                    contentType === value
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Answers */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Smart answers
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              Makes wrong answers harder by picking fish from the same family as the correct answer, instead of random ones.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SMART_ANSWER_OPTIONS.map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setSmartAnswers(value)}
                  className={cn(
                    "flex flex-col items-center rounded-xl border-2 px-3 py-2.5 text-center transition-all",
                    smartAnswers === value
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                  )}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs opacity-70 mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Label filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Fish categories
              </label>
              {selectedLabels.length > 0 && (
                <button
                  onClick={() => setSelectedLabels([])}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Clear ({selectedLabels.length} selected)
                </button>
              )}
              {selectedLabels.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  All included
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {QUIZ_FILTER_LABELS.map((label) => {
                const active = selectedLabels.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    style={
                      active
                        ? {
                            backgroundColor: label.color + "25",
                            borderColor: label.color,
                            color: label.color,
                          }
                        : undefined
                    }
                    className={cn(
                      "rounded-full border-2 px-3 py-1 text-xs font-medium transition-all",
                      active
                        ? ""
                        : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500",
                    )}
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Select categories to limit questions to those fish families. Leave all unselected to include everything.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-6 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Start button */}
      <div className="p-6 pt-2">
        <button
          onClick={handleStart}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2.5 h-13 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-base transition-colors py-3.5"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating quiz…
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start Quiz
            </>
          )}
        </button>
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          {numQuestions} questions · {numAnswers} options each ·{" "}
          {mode === "by_image" ? "Identify from image" : "Match name to photo"}
        </p>
      </div>
    </div>
  );
}
