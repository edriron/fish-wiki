import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LabelForm } from "@/components/admin/labels/LabelForm";

export default async function NewLabelPage() {
  const supabase = await createClient();
  const { data: allLabels } = await supabase
    .from("labels")
    .select("id, name, color, parent_id")
    .order("name");

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

      <LabelForm allLabels={allLabels ?? []} />
    </div>
  );
}
