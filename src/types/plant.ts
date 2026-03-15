export interface PlantSpecies {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  type: "plant" | "coral";       // 'plant' or 'coral'
  description: string | null;
  light_requirement: string | null;  // 'low' | 'medium' | 'high'
  co2_requirement: string | null;    // 'none' | 'low' | 'medium' | 'high' (plants)
  difficulty: string | null;         // 'easy' | 'intermediate' | 'expert'
  substrate: boolean | null;         // true = needs substrate planting (plants)
  growth_rate: string | null;        // 'slow' | 'medium' | 'fast'
  temp_min: number | null;
  temp_max: number | null;
  water_type: string | null;         // 'freshwater' | 'saltwater' | 'brackish'
  origin_region: string | null;
  primary_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlantImage {
  id: string;
  plant_id: string;
  image_url: string;
  alt_text: string | null;
  caption: string | null;
  is_primary: boolean;
  order_index: number;
}

export interface PlantCardData {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  type: string;
  water_type: string | null;
  difficulty: string | null;
  light_requirement: string | null;
  primary_image_url: string | null;
}
