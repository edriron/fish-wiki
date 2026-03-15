import Link from "next/link";
import { ArrowRight, Droplets, Fish, Waves, Leaf, Shell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 300;

const waterTypeCards = [
  {
    title: "Freshwater",
    description: "Rivers, lakes, and streams. Goldfish, bettas, tetras, cichlids, and thousands more.",
    icon: Droplets,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900/60",
    query: "freshwater",
  },
  {
    title: "Saltwater",
    description: "Oceans and coral reefs. Clownfish, tangs, lionfish, and the vast marine world.",
    icon: Waves,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-100 dark:border-cyan-900/60",
    query: "saltwater",
  },
  {
    title: "Brackish",
    description: "Where salt meets fresh — estuaries and mangroves. Unique species adapted to mixed waters.",
    icon: Fish,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-100 dark:border-purple-900/60",
    query: "brackish",
  },
];

export default async function HomePage() {
  const supabase = createPublicClient();

  const { count: fishCount } = await supabase
    .from("fish_species")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  let totalPlants = 0;
  try {
    const { count } = await supabase
      .from("plant_species")
      .select("id", { count: "exact", head: true })
      .eq("published", true);
    totalPlants = count ?? 0;
  } catch {
    // table doesn't exist yet
  }

  const totalFish = fishCount ?? 0;

  return (
    <div>
      {/* Hero — compact */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-950 to-teal-900 text-white">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-20">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-teal-300">
              <Fish className="h-3.5 w-3.5" />
              {totalFish > 0
                ? `${totalFish.toLocaleString()} fish${totalPlants > 0 ? ` · ${totalPlants.toLocaleString()} plants` : ""} documented`
                : "Discover aquatic life"}
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Explore the World of{" "}
              <span className="text-teal-400">Aquatic Life</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              Your comprehensive reference for fish, plants, and corals. Detailed care guides,
              habitat information, and imagery for freshwater, saltwater, and brackish species.
            </p>

            <div className="mt-8">
              <form action="/wiki" method="GET" className="flex max-w-md gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="q"
                    placeholder="Search species..."
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

            <div className="mt-3 flex items-center gap-4">
              <Link
                href="/wiki"
                className="inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                Browse all fish
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/plants"
                className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Browse plants &amp; corals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Water Type */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Browse Fish by Water Type
          </h2>
          <p className="mt-1.5 text-slate-500 dark:text-slate-400">
            Find species suited to your aquarium environment
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {waterTypeCards.map((card) => (
            <Link
              key={card.query}
              href={`/wiki?water_type=${card.query}`}
              className="group"
            >
              <Card
                className={`h-full border-2 ${card.border} ${card.bg} transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md`}
              >
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex rounded-xl p-2.5 bg-white/60">
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {card.description}
                  </p>
                  <div
                    className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${card.color} group-hover:gap-2 transition-all`}
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

      {/* Plants & Corals */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Plants &amp; Corals
          </h2>
          <p className="mt-1.5 text-slate-500 dark:text-slate-400">
            Complete your aquascape with our plant and coral database
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link href="/plants?type=plant" className="group">
            <Card className="h-full border-2 border-green-100 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 inline-flex rounded-xl p-2.5 bg-white/60">
                  <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Aquatic Plants
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Freshwater plants for planted tanks. Light requirements, CO₂ needs, substrate info, and growth rates.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 group-hover:gap-2 transition-all">
                  Browse plants
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/plants?type=coral" className="group">
            <Card className="h-full border-2 border-pink-100 dark:border-pink-900/60 bg-pink-50 dark:bg-pink-950/40 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 inline-flex rounded-xl p-2.5 bg-white/60">
                  <Shell className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Corals
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Marine corals for reef tanks. Lighting, flow requirements, difficulty, and care information.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-pink-600 dark:text-pink-400 group-hover:gap-2 transition-all">
                  Browse corals
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
