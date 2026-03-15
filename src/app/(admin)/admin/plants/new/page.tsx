import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlantForm } from "@/components/admin/plants/PlantForm";

export default function NewPlantPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/plants" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Plants &amp; Corals
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add Plant / Coral</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Fill in the details to add a new species.</p>
      </div>
      <PlantForm />
    </div>
  );
}
