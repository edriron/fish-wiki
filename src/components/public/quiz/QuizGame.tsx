"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ChevronRight,
  Loader2,
  Fish,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitAnswer, finishQuiz } from "@/app/actions/quiz";
import type { QuizQuestion, QuizOption } from "@/types/quiz";

// ─── types ───────────────────────────────────────────────────────────────────

interface AnswerRecord {
  selectedId: string;
  isCorrect: boolean;
  correctAnswerId: string;
}

interface Props {
  attemptId: string;
  questions: QuizQuestion[];
  mode: "by_image" | "by_name";
  alreadyCompleted: boolean;
  initialScore: number | null;
}

type OptionState = "idle" | "loading" | "correct" | "wrong";

// ─── SkeletonImage ────────────────────────────────────────────────────────────
// Renders a pulsing skeleton behind the image until it finishes loading.
// Key this component on `src` from the parent so it resets on every new image.

function SkeletonImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
          <Fish
            className="text-slate-400 dark:text-slate-500 animate-bounce"
            style={{ width: "clamp(1.5rem, 8%, 3rem)", height: "clamp(1.5rem, 8%, 3rem)" }}
          />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => setLoaded(true)}
        sizes={sizes}
        priority={priority}
      />
    </>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatName(displayName: string, scientificName: string): string {
  if (displayName.toLowerCase() === scientificName.toLowerCase()) return displayName;
  return `${displayName} (${scientificName})`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  return <span className={cn("text-6xl font-extrabold tabular-nums", color)}>{score}%</span>;
}

function getOptionState(
  option: QuizOption,
  answer: AnswerRecord | undefined,
  phase: "question" | "feedback",
  pendingOptionId: string | null,
): OptionState {
  if (pendingOptionId === option.id) return "loading";
  if (phase === "question" || !answer) return "idle";
  if (option.id === answer.correctAnswerId) return "correct";
  if (option.id === answer.selectedId) return "wrong";
  return "idle";
}

function optionStyle(state: OptionState): string {
  switch (state) {
    case "loading":
      return "border-slate-400 dark:border-slate-400 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-wait";
    case "correct":
      return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200";
    case "wrong":
      return "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200";
    default:
      return "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:hover:border-slate-200 disabled:hover:bg-transparent dark:disabled:hover:border-slate-600 dark:disabled:hover:bg-transparent";
  }
}

// ─── main component ───────────────────────────────────────────────────────────

export function QuizGame({
  attemptId,
  questions,
  mode,
  alreadyCompleted,
  initialScore,
}: Props) {
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [phase, setPhase] = useState<"question" | "feedback" | "results">(
    alreadyCompleted ? "results" : "question",
  );
  const [finalScore, setFinalScore] = useState<number | null>(
    alreadyCompleted ? initialScore : null,
  );
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  function handleSelectAnswer(option: QuizOption) {
    if (phase !== "question" || isPending) return;
    setPendingOptionId(option.id);
    startTransition(async () => {
      const result = await submitAnswer(attemptId, currentIndex, option.id);
      if (result.error || result.isCorrect === undefined) {
        setPendingOptionId(null);
        return;
      }
      setAnswers((prev) => ({
        ...prev,
        [currentIndex]: {
          selectedId: option.id,
          isCorrect: result.isCorrect!,
          correctAnswerId: result.correctAnswerId!,
        },
      }));
      setPendingOptionId(null);
      setPhase("feedback");
    });
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setPhase("question");
    } else {
      startTransition(async () => {
        const result = await finishQuiz(attemptId);
        setFinalScore(result.score ?? 0);
        setPhase("results");
      });
    }
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (phase === "results") {
    const score = finalScore ?? 0;
    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    const message =
      score === 100
        ? "Perfect score! You're a fish expert!"
        : score >= 80
          ? "Great job! You really know your fish."
          : score >= 50
            ? "Not bad! Keep learning."
            : "Keep studying — you'll get there!";

    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-6">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Quiz Complete!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{message}</p>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm mb-6">
          <ScoreBadge score={score} />
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">
            {alreadyCompleted
              ? `You scored ${score}% on this quiz`
              : `${correctCount} / ${total} correct`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 text-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Link>
          <Link
            href="/wiki"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium px-6 py-3 text-sm transition-colors"
          >
            Browse Wiki
          </Link>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────

  const progress = ((currentIndex + (phase === "feedback" ? 1 : 0)) / total) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>Question {currentIndex + 1} of {total}</span>
          <span>{Object.values(answers).filter((a) => a.isCorrect).length} correct</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {mode === "by_image" ? (
          <ByImageQuestion
            key={currentQuestion.index}
            question={currentQuestion}
            answer={currentAnswer}
            phase={phase}
            isPending={isPending}
            pendingOptionId={pendingOptionId}
            onSelect={handleSelectAnswer}
            onNext={handleNext}
            isLast={currentIndex === total - 1}
          />
        ) : (
          <ByNameQuestion
            key={currentQuestion.index}
            question={currentQuestion}
            answer={currentAnswer}
            phase={phase}
            isPending={isPending}
            pendingOptionId={pendingOptionId}
            onSelect={handleSelectAnswer}
            onNext={handleNext}
            isLast={currentIndex === total - 1}
          />
        )}
      </div>
    </div>
  );
}

// ─── shared props ─────────────────────────────────────────────────────────────

interface QuestionProps {
  question: QuizQuestion;
  answer: AnswerRecord | undefined;
  phase: "question" | "feedback";
  isPending: boolean;
  pendingOptionId: string | null;
  onSelect: (option: QuizOption) => void;
  onNext: () => void;
  isLast: boolean;
}

// ─── ByImageQuestion ─────────────────────────────────────────────────────────
// Question = image  |  Answers = text name buttons

function ByImageQuestion({
  question,
  answer,
  phase,
  isPending,
  pendingOptionId,
  onSelect,
  onNext,
  isLast,
}: QuestionProps) {
  return (
    <>
      {/* Subject image with skeleton */}
      <div className="relative w-full aspect-video bg-slate-200 dark:bg-slate-700">
        {question.imageUrl ? (
          <SkeletonImage
            key={question.imageUrl}
            src={question.imageUrl}
            alt="Identify this species"
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium">
          What is this?
        </div>
      </div>

      {/* Text answer buttons */}
      <div className="p-4 space-y-2.5">
        {question.options.map((option) => {
          const state = getOptionState(option, answer, phase, pendingOptionId);
          const isThisPending = pendingOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              disabled={phase === "feedback" || isPending}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                optionStyle(state),
              )}
            >
              <span className="text-sm font-medium leading-snug">
                {formatName(option.displayName, option.scientificName)}
              </span>
              <span className="flex-shrink-0 ml-2">
                {isThisPending && (
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                )}
                {state === "correct" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                {state === "wrong" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </span>
            </button>
          );
        })}

        <FeedbackFooter
          phase={phase}
          answer={answer}
          onNext={onNext}
          isLast={isLast}
          isPending={isPending}
        />
      </div>
    </>
  );
}

// ─── ByNameQuestion ──────────────────────────────────────────────────────────
// Question = name  |  Answers = image cards

function ByNameQuestion({
  question,
  answer,
  phase,
  isPending,
  pendingOptionId,
  onSelect,
  onNext,
  isLast,
}: QuestionProps) {
  const cols = question.options.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <>
      {/* Subject name */}
      <div className="px-6 py-8 text-center border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          Which photo shows this fish?
        </p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {question.displayName}
        </h2>
        {question.displayName.toLowerCase() !== question.scientificName.toLowerCase() && (
          <p className="text-sm italic text-slate-400 dark:text-slate-500 mt-1">
            {question.scientificName}
          </p>
        )}
      </div>

      {/* Image option grid */}
      <div className={cn("grid gap-2 p-4", cols)}>
        {question.options.map((option) => {
          const state = getOptionState(option, answer, phase, pendingOptionId);
          const isThisPending = pendingOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              disabled={phase === "feedback" || isPending}
              className={cn(
                "relative aspect-square rounded-xl border-2 overflow-hidden transition-all",
                optionStyle(state),
              )}
            >
              {option.imageUrl ? (
                <SkeletonImage
                  key={option.imageUrl}
                  src={option.imageUrl}
                  alt={option.displayName}
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 220px"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs text-slate-400 p-2 text-center">
                  {option.displayName}
                </div>
              )}

              {/* Loading overlay */}
              {isThisPending && (
                <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin drop-shadow-lg" />
                </div>
              )}
              {/* Correct/wrong overlay */}
              {state === "correct" && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 drop-shadow-lg" />
                </div>
              )}
              {state === "wrong" && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-500 drop-shadow-lg" />
                </div>
              )}
              {/* Name label on feedback */}
              {phase === "feedback" && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1.5">
                  <p className="text-white text-xs font-medium truncate text-center">
                    {option.displayName}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <FeedbackFooter
          phase={phase}
          answer={answer}
          onNext={onNext}
          isLast={isLast}
          isPending={isPending}
        />
      </div>
    </>
  );
}

// ─── FeedbackFooter ───────────────────────────────────────────────────────────

function FeedbackFooter({
  phase,
  answer,
  onNext,
  isLast,
  isPending,
}: {
  phase: "question" | "feedback";
  answer: AnswerRecord | undefined;
  onNext: () => void;
  isLast: boolean;
  isPending: boolean;
}) {
  if (phase !== "feedback" || !answer) return null;

  return (
    <div
      className={cn(
        "mt-1 rounded-xl px-4 py-3 flex items-center justify-between gap-3",
        answer.isCorrect
          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {answer.isCorrect ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Correct!
            </span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Incorrect
            </span>
          </>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={isPending}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex-shrink-0 disabled:opacity-60",
          answer.isCorrect
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {isLast ? "See Results" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
