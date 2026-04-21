export type QuizDifficulty = "easy" | "medium" | "hard" | "custom";
export type SmartAnswerLevel = "easy" | "medium" | "hard" | "extreme";

/** Percentage of distractors that are drawn from the same label hierarchy as the correct answer */
export const SMART_ANSWER_PERCENTAGES: Record<SmartAnswerLevel, number> = {
  easy: 0,
  medium: 0.25,
  hard: 0.75,
  extreme: 1.0,
};

/** Default smart answer level matched to quiz difficulty */
export const SMART_ANSWER_DEFAULTS: Record<Exclude<QuizDifficulty, "custom">, SmartAnswerLevel> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};
export type QuizMode = "by_image" | "by_name";
export type QuizContentType = "fish" | "plants" | "both";

export interface QuizOption {
  id: string;
  displayName: string;
  scientificName: string;
  imageUrl: string | null;
}

/** Question shape sent to the client — no correctAnswerId */
export interface QuizQuestion {
  index: number;
  subjectType: "fish" | "plant";
  displayName: string;
  scientificName: string;
  imageUrl: string | null;
  options: QuizOption[];
}

/** Full shape stored server-side in quiz_attempts.questions JSONB */
export interface QuizQuestionStored extends QuizQuestion {
  correctAnswerId: string;
}

export interface QuizConfig {
  difficulty: QuizDifficulty;
  numQuestions: number;
  numAnswers: number;
  mode: QuizMode;
  contentType: QuizContentType;
  /** IDs from QUIZ_FILTER_LABELS; empty array = all */
  labelIds: string[];
  smartAnswers: SmartAnswerLevel;
}

export interface QuizHistoryEntry {
  id: string;
  difficulty: string;
  score: number;
  numQuestions: number;
  completedAt: string;
}
