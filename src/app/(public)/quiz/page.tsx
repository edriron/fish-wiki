import { QuizSetup } from "@/components/public/quiz/QuizSetup";
import { Brain } from "lucide-react";

export const revalidate = 3600;

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/40 mb-4">
          <Brain className="w-7 h-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Fish Quiz
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Test your knowledge of aquarium fish and plants.
          <br />
          Pick a difficulty and start guessing!
        </p>
      </div>

      <QuizSetup />
    </div>
  );
}
