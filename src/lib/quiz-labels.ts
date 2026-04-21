export interface QuizFilterLabel {
  id: string;
  name: string;
  color: string;
}

/**
 * Top-level taxonomic labels available in the quiz label filter.
 * Only includes meaningful fish-family/type groups — not behavioral labels
 * (Aggressive, Community Safe, etc.) and not overly granular sub-groups
 * (Mbuna, Lake Malawi, etc.).
 *
 * When one of these is selected, the server action expands it to include
 * all descendant label IDs before filtering fish/plants.
 *
 * To add or remove filter options, edit this array.
 */
export const QUIZ_FILTER_LABELS: QuizFilterLabel[] = [
  { id: "11111111-0000-0000-0000-000000000001", name: "Cichlid", color: "#f97316" },
  { id: "11111111-0000-0000-0000-000000000002", name: "Catfish", color: "#8b5cf6" },
  { id: "11111111-0000-0000-0000-000000000003", name: "Tetra", color: "#3b82f6" },
  { id: "11111111-0000-0000-0000-000000000004", name: "Livebearer", color: "#22c55e" },
  { id: "11111111-0000-0000-0000-000000000005", name: "Barb", color: "#ea7948" },
  { id: "11111111-0000-0000-0000-000000000006", name: "Loach", color: "#eab308" },
  { id: "11111111-0000-0000-0000-000000000007", name: "Rainbowfish", color: "#dc1bd7" },
  { id: "11111111-0000-0000-0000-000000000008", name: "Betta / Anabantoid", color: "#ec4899" },
  { id: "11111111-0000-0000-0000-000000000009", name: "Goldfish", color: "#f97316" },
  { id: "11111111-0000-0000-0000-000000000010", name: "Marine", color: "#06b6d4" },
];
