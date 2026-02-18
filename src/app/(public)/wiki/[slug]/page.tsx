import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("fish_species")
    .select("slug")
    .eq("published", true);

  return (
    data?.map((f) => ({
      slug: f.slug,
    })) ?? []
  );
}

export default async function FishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ unwrap params

  const supabase = createPublicClient();

  const { data: fish } = await supabase
    .from("fish_species")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!fish) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-4xl font-bold">{fish.common_name}</h1>
      <p className="italic text-gray-600">{fish.scientific_name}</p>
      <p className="mt-4">{fish.description}</p>
    </main>
  );
}
