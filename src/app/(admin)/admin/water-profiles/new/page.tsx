import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WaterProfileForm } from "@/components/admin/water-profiles/WaterProfileForm";

export default function NewWaterProfilePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/water-profiles"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Water Profiles
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add Water Profile</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Define water parameters for a habitat like Malawi Lake or Amazon River.
        </p>
      </div>

      <WaterProfileForm />
    </div>
  );
}
