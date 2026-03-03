"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface FishData {
  scientific_name: string;
  description: string;
  origin_region: string;
  water_type: "freshwater" | "saltwater" | "brackish";
  difficulty_level: "beginner" | "intermediate" | "expert";
  diet: "Carnivore" | "Omnivore" | "Herbivore";
  min_tank_liters: number;
  water_profile_name: string | null;
  label_ids: string[];
}

export async function generateFishData(
  commonName: string,
  waterProfiles: { id: string; name: string }[],
  labels: { id: string; name: string; parent_id: string | null }[],
) {
  if (!commonName) {
    return { error: "Missing common name." };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

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
  "water_profile_name": "string | null",
  "label_ids": ["uuid", ...]
}

Fish: ${commonName}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const fishData: FishData = JSON.parse(responseText);

    return { data: fishData };
  } catch (error) {
    console.error("Gemini error:", error);
    return { error: "AI generation failed." };
  }
}
