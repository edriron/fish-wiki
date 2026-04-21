import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, UserRound } from "lucide-react";
import { getQuizHistory } from "@/app/actions/quiz";

function difficultyLabel(d: string) {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function difficultyColor(d: string) {
  switch (d) {
    case "easy":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "hard":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/my-tanks/login");

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "User";

  const { history } = await getQuizHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/40">
          <UserRound className="w-7 h-7 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {displayName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Quiz history */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quiz History
            </h2>
          </div>
          <Link
            href="/quiz"
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            Take a quiz
          </Link>
        </div>

        {!history || history.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center">
            <Brain className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No quizzes completed yet.
            </p>
            <Link
              href="/quiz"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
            >
              Take your first quiz
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
              <span>Date</span>
              <span className="text-center">Difficulty</span>
              <span className="text-right">Score</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {history.map((entry) => {
                const date = new Date(entry.completedAt);
                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-3 items-center px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {entry.numQuestions} questions
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColor(entry.difficulty)}`}
                      >
                        {difficultyLabel(entry.difficulty)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold tabular-nums ${scoreColor(entry.score)}`}
                      >
                        {entry.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
