"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

interface FishData {
  scientific_name: string;
  description: string;
  origin_region: string;
  water_type: "freshwater" | "saltwater" | "brackish";
  difficulty_level: "beginner" | "intermediate" | "expert";
  diet: "Carnivore" | "Omnivore" | "Herbivore";
  min_tank_liters: number;
  max_size_cm: number | null;
  water_profile_name: string | null;
  label_ids: string[];
}

function getApiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];
}

function isQuotaError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

export async function generateFishData(
  commonName: string,
  waterProfiles: { id: string; name: string }[],
  labels: { id: string; name: string; parent_id: string | null }[],
) {
  if (!commonName) {
    return { error: "Missing common name." };
  }

  const keys = getApiKeys();
  if (keys.length === 0) {
    return { error: "No API keys configured." };
  }

  const profileNames = waterProfiles.map((p) => p.name);

  const labelLines = labels.map((l) => {
    const parent = labels.find((p) => p.id === l.parent_id);
    return `- ${l.id}: ${l.name}${parent ? ` (under ${parent.name})` : ""}`;
  });

  const prompt = `
You are a fish expert.

Available water profiles:
${profileNames.join(", ")}

Choose the most suitable water profile from the list.
If none match, return null.

Available labels — choose the most specific leaf labels that apply to this fish.
Ancestor labels will be auto-selected automatically, so only pick the deepest relevant ones:
${labelLines.join("\n")}

Return STRICT JSON:

{
  "scientific_name": "string",
  "description": "string",
  "origin_region": "string",
  "water_type": "freshwater | saltwater | brackish",
  "difficulty_level": "beginner | intermediate | expert",
  "diet": "Carnivore | Omnivore | Herbivore",
  "min_tank_liters": number,
  "max_size_cm": number | null,
  "water_profile_name": "string | null",
  "label_ids": ["uuid", ...]
}

Fish: ${commonName}
`;

  const warnings: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const genAI = new GoogleGenerativeAI(keys[i]);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const fishData: FishData = JSON.parse(responseText);
      return { data: fishData, warnings };
    } catch (error) {
      if (isQuotaError(error)) {
        warnings.push(`API key ${i + 1} quota exceeded.`);
        if (i === keys.length - 1) {
          return {
            error: "All API tokens are exhausted. Please try again later or add more API keys.",
            warnings,
          };
        }
        // try next key
        continue;
      }
      console.error("Gemini error:", error);
      return { error: "AI generation failed.", warnings };
    }
  }

  return { error: "AI generation failed.", warnings };
}

// Searches iNaturalist taxa by name and returns observation + default photos.
export async function searchInaturalistImages(query: string) {
  if (!query.trim()) return { error: "Empty query." };

  const headers = { "User-Agent": "FishWiki/1.0" };

  try {
    // Step 1: find the best-matching taxon
    const taxaRes = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query.trim())}&rank=species,subspecies&per_page=5`,
      { headers, next: { revalidate: 0 } },
    );
    if (!taxaRes.ok) return { error: "iNaturalist search failed." };

    const taxaData = await taxaRes.json();
    const taxa: Array<{
      id: number;
      default_photo?: { url?: string; medium_url?: string };
    }> = taxaData.results ?? [];

    if (taxa.length === 0) return { error: "No species found on iNaturalist." };

    const urls: string[] = [];

    // Collect default photos from the first few matching taxa
    for (const taxon of taxa.slice(0, 3)) {
      const raw = taxon.default_photo?.medium_url ?? taxon.default_photo?.url;
      if (raw) {
        // iNaturalist returns "square" size; swap to "medium" for better res
        urls.push(raw.replace("/square.", "/medium.").replace("square.jpg", "medium.jpg"));
      }
    }

    // Step 2: research-grade observation photos for the best match
    const obsRes = await fetch(
      `https://api.inaturalist.org/v1/observations?taxon_id=${taxa[0].id}&photos=true&per_page=10&quality_grade=research&order_by=votes`,
      { headers, next: { revalidate: 0 } },
    );
    if (obsRes.ok) {
      const obsData = await obsRes.json();
      const obsPhotos: Array<{ url?: string }> = (obsData.results ?? []).flatMap(
        (obs: { photos?: Array<{ url?: string }> }) => obs.photos ?? [],
      );
      for (const photo of obsPhotos) {
        if (photo.url) {
          const medUrl = photo.url.replace("/square.", "/medium.").replace("square.jpg", "medium.jpg");
          if (!urls.includes(medUrl)) urls.push(medUrl);
        }
      }
    }

    const final = urls.slice(0, 8);
    if (final.length === 0) return { error: "No photos found on iNaturalist." };
    return { data: final };
  } catch {
    return { error: "iNaturalist search failed." };
  }
}

// Searches Wikimedia Commons file names/descriptions by an arbitrary query.
export async function searchImagesByQuery(query: string) {
  if (!query.trim()) return { error: "Empty query." };

  try {
    const search = encodeURIComponent(query.trim());
    const apiUrl =
      `https://commons.wikimedia.org/w/api.php?action=query` +
      `&generator=search&gsrnamespace=6&gsrsearch=${search}` +
      `&prop=imageinfo&iiprop=url|mime&format=json&gsrlimit=8&origin=*`;

    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "FishWiki/1.0" },
      next: { revalidate: 0 },
    });

    if (!response.ok) return { error: "Search failed." };

    const data = await response.json();
    const pages: Record<string, unknown> = data.query?.pages ?? {};

    const urls = Object.values(pages)
      .map((page) => {
        const p = page as { imageinfo?: { url: string; mime: string }[] };
        return p.imageinfo?.[0];
      })
      .filter(
        (info): info is { url: string; mime: string } =>
          !!info?.url && /^image\/(jpeg|png|webp)$/.test(info.mime ?? ""),
      )
      .map((info) => info.url)
      .slice(0, 8);

    if (urls.length === 0) return { error: "No images found." };

    return { data: urls };
  } catch {
    return { error: "Search failed." };
  }
}

// Finds images via the Wikipedia article for the species (step 1: image titles,
// step 2: resolve URLs). Wikipedia articles curate the best photos per species,
// so this is more reliable than searching Wikimedia file names directly.
export async function generateFishImageUrls(scientificName: string) {
  if (!scientificName) return { error: "Missing scientific name." };

  const headers = { "User-Agent": "FishWiki/1.0" };

  try {
    // Step 1: get image titles listed in the Wikipedia article
    const wikiTitle = scientificName.replace(/ /g, "_");
    const wikiUrl =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encodeURIComponent(wikiTitle)}&prop=images&redirects=1` +
      `&imlimit=15&format=json&origin=*`;

    const wikiRes = await fetch(wikiUrl, { headers, next: { revalidate: 0 } });
    if (!wikiRes.ok) return { error: "Image search failed." };

    const wikiData = await wikiRes.json();
    const wikiPage = Object.values(
      wikiData.query?.pages ?? {},
    )[0] as { images?: { title: string }[] } | undefined;

    const imageTitles = (wikiPage?.images ?? [])
      .map((img) => img.title)
      .filter((t) => /\.(jpe?g|png|webp)$/i.test(t))
      .slice(0, 8);

    if (imageTitles.length === 0) {
      return { error: "No images found for this species." };
    }

    // Step 2: resolve actual file URLs for those titles
    const infoUrl =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${imageTitles.join("|")}&prop=imageinfo&iiprop=url|mime` +
      `&format=json&origin=*`;

    const infoRes = await fetch(infoUrl, { headers, next: { revalidate: 0 } });
    if (!infoRes.ok) return { error: "Image search failed." };

    const infoData = await infoRes.json();
    const urls = Object.values(infoData.query?.pages ?? {})
      .map((page) => {
        const p = page as { imageinfo?: { url: string; mime: string }[] };
        return p.imageinfo?.[0];
      })
      .filter(
        (info): info is { url: string; mime: string } =>
          !!info?.url && /^image\/(jpeg|png|webp)$/.test(info.mime ?? ""),
      )
      .map((info) => info.url)
      .slice(0, 5);

    if (urls.length === 0) return { error: "No images found for this species." };

    return { data: urls };
  } catch (error) {
    console.error("Image search error:", error);
    return { error: "Image search failed." };
  }
}
