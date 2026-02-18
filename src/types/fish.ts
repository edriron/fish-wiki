export interface FishLabel {
  id: string;
  name: string;
  color: string | null;
}

export interface FishImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  caption: string | null;       // display label: "Male", "Female holding fry", "Juvenile"
  variant_id: string | null;    // null = base fish images
  is_primary: boolean;
  order_index: number;
}

export interface FishVariant {
  id: string;
  fish_id: string;
  name: string;                 // "Black Acei", "Super White", "Albino"
  description: string | null;
  order_index: number;
}

// Matches actual fish_species columns in the DB
export interface FishSpecies {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  description: string | null;
  origin_region: string | null;
  water_type: string | null;
  difficulty_level: string | null;
  diet: string | null;
  water_profile_id: string | null;
  min_tank_liters: number | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Water profile row (from water_profiles table)
export interface WaterProfile {
  id: string;
  name: string;
  description: string | null;
  temp_min: number | null;
  temp_max: number | null;
  ph_min: number | null;
  ph_max: number | null;
  gh_min: number | null;
  gh_max: number | null;
  kh_min: number | null;
  kh_max: number | null;
}

export interface FishCardData {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  water_type: string | null;
  difficulty_level: string | null;
  primary_image: string | null;
  primary_image_alt: string | null;
  labels: FishLabel[];
}

export interface FishDetail extends FishSpecies {
  images: FishImage[];
  labels: FishLabel[];
  water_profile: WaterProfile | null;
}
