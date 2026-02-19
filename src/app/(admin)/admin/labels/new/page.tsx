import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LabelForm } from "@/components/admin/labels/LabelForm";

export default function NewLabelPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/labels"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Labels
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add Label</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Create a new tag label for fish species.</p>
      </div>

      <LabelForm />
    </div>
  );
}
