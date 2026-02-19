import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LabelDeleteButton } from "@/components/admin/labels/LabelDeleteButton";

export default async function AdminLabelsPage() {
  const supabase = await createClient();

  const { data: labels } = await supabase
    .from("labels")
    .select("id, name, color")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Labels</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{labels?.length ?? 0} labels total</p>
        </div>
        <Link
          href="/admin/labels/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Label
        </Link>
      </div>

      {!labels || labels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-3">No labels yet.</p>
          <Link
            href="/admin/labels/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Label
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-110">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Label</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Color</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {labels.map((label) => (
                <tr key={label.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full border px-3 py-1 text-sm font-medium"
                      style={
                        label.color
                          ? {
                              backgroundColor: `${label.color}20`,
                              color: label.color,
                              borderColor: `${label.color}40`,
                            }
                          : undefined
                      }
                    >
                      {label.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {label.color ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded-full border border-slate-200 dark:border-slate-600"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {label.color}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/labels/${label.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <LabelDeleteButton labelId={label.id} labelName={label.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
