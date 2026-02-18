import { createPublicClient } from "@/lib/supabase/public";
import Link from "next/link";

export const revalidate = 300; // ISR every 5 minutes

export default async function WikiPage() {
  const supabase = createPublicClient();

  const { data: fish } = await supabase
    .from("fish_species")
    .select("id, slug, common_name, scientific_name")
    .eq("published", true)
    .order("common_name");

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Fish Species</h1>

      <div className="grid gap-4">
        {fish?.map((f) => (
          <Link
            key={f.id}
            href={`/wiki/${f.slug}`}
            className="rounded border p-4 hover:bg-gray-100"
          >
            <h2 className="text-xl font-semibold">{f.common_name}</h2>
            <p className="text-gray-600 italic">{f.scientific_name}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
