import Link from "next/link";
import { ArrowRight, Droplets, Fish, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 300;

const waterTypeCards = [
  {
    title: "Freshwater",
    description:
      "Rivers, lakes, and streams. Home to species like goldfish, bettas, tetras, and thousands more.",
    icon: Droplets,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    query: "freshwater",
  },
  {
    title: "Saltwater",
    description:
      "Oceans and coral reefs. Explore clownfish, tangs, lionfish, and the vast marine world.",
    icon: Waves,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    query: "saltwater",
  },
  {
    title: "Brackish",
    description:
      "Where salt meets fresh — estuaries and mangroves. Unique species adapted to mixed waters.",
    icon: Fish,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    query: "brackish",
  },
];

export default async function HomePage() {
  const supabase = createPublicClient();

  const { count } = await supabase
    .from("fish_species")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  const totalSpecies = count ?? 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-950 to-teal-900 text-white">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-teal-300">
              <Fish className="h-3.5 w-3.5" />
              {totalSpecies > 0
                ? `${totalSpecies.toLocaleString()} species documented`
                : "Discover aquatic life"}
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Explore the World of{" "}
              <span className="text-teal-400">Aquatic Life</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Your comprehensive reference for fish species. Discover detailed
              profiles, care guides, habitat information, and stunning imagery
              for freshwater, saltwater, and brackish fish.
            </p>

            <div className="mt-10">
              <form action="/wiki" method="GET" className="flex max-w-md gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="q"
                    placeholder="Search fish species..."
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-lg bg-teal-500 px-5 text-sm font-semibold text-white transition hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="mt-4">
              <Link
                href="/wiki"
                className="inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                Browse all species
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Water Type Cards */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Browse by Water Type
          </h2>
          <p className="mt-2 text-slate-500">
            Find fish suited to your aquarium environment
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {waterTypeCards.map((card) => (
            <Link
              key={card.query}
              href={`/wiki?water_type=${card.query}`}
              className="group"
            >
              <Card
                className={`h-full border-2 ${card.border} ${card.bg} transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md`}
              >
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-xl p-3 bg-white/60`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {card.description}
                  </p>
                  <div
                    className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${card.color} group-hover:gap-2 transition-all`}
                  >
                    Explore {card.title.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-teal-600 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to explore?</h2>
          <p className="mt-3 text-teal-100">
            Dive into our full database of documented fish species.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-teal-700 hover:bg-teal-50 font-semibold"
          >
            <Link href="/wiki">
              Browse All Species
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
