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
}

export async function generateFishData(
  commonName: string,
  waterProfiles: { id: string; name: string }[],
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

  const prompt = `
You are a fish expert.

Available water profiles:
${profileNames.join(", ")}

Choose the most suitable water profile from the list.
If none match, return null.

Return STRICT JSON:

{
  "scientific_name": "string",
  "description": "string",
  "origin_region": "string",
  "water_type": "freshwater | saltwater | brackish",
  "difficulty_level": "beginner | intermediate | expert",
  "diet": "Carnivore | Omnivore | Herbivore",
  "min_tank_liters": number,
  "water_profile_name": "string | null"
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
