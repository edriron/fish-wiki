import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LabelForm } from "@/components/admin/labels/LabelForm";
import { LabelDeleteButton } from "@/components/admin/labels/LabelDeleteButton";

export default async function EditLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: label } = await supabase
    .from("labels")
    .select("id, name, color")
    .eq("id", id)
    .single();

  if (!label) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/labels"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Labels
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Label</h1>
            <p className="mt-1 text-slate-500">{label.name}</p>
          </div>
          <LabelDeleteButton labelId={label.id} labelName={label.name} />
        </div>
      </div>

      <LabelForm label={label} />
    </div>
  );
}
