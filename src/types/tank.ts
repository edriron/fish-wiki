export interface Tank {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  volume_liters: number | null;
  created_at: string;
  updated_at: string;
}

export interface TankLabel {
  id: string;
  name: string;
  color: string | null;
  parent_id: string | null;
}

export interface TankFishData {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  water_type: string | null;
  diet: string | null;
  difficulty_level: string | null;
  max_size_cm: number | null;
  fish_images: { image_url: string; alt_text: string | null; is_primary: boolean }[];
  fish_labels: { label_id: string; labels: TankLabel | null }[];
}

export interface TankFishItem {
  id: string;
  tank_id: string;
  fish_id: string;
  quantity: number;
  notes: string | null;
  fish_species: TankFishData;
}

export interface TankPlantData {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  type: string;
  water_type: string | null;
  difficulty: string | null;
  light_requirement: string | null;
  plant_images: { image_url: string; alt_text: string | null; is_primary: boolean }[];
}

export interface TankPlantItem {
  id: string;
  tank_id: string;
  plant_id: string;
  quantity: number;
  notes: string | null;
  plant_species: TankPlantData;
}

export interface TankWithCounts {
  id: string;
  name: string;
  description: string | null;
  volume_liters: number | null;
  created_at: string;
  fishSpeciesCount: number;
  plantSpeciesCount: number;
}

export interface FishBasic {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  fish_images: { image_url: string; is_primary: boolean }[];
}

export interface PlantBasic {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  type: string;
  plant_images: { image_url: string; is_primary: boolean }[];
}
