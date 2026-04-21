"use server";

import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  QuizConfig,
  QuizQuestion,
  QuizQuestionStored,
  QuizOption,
  QuizHistoryEntry,
} from "@/types/quiz";
import { SMART_ANSWER_PERCENTAGES } from "@/types/quiz";

// ─── types ────────────────────────────────────────────────────────────────────

type LabelRow = { id: string; parent_id: string | null };

interface SpeciesItem {
  id: string;
  displayName: string;
  scientificName: string;
  imageUrl: string | null;
  type: "fish" | "plant";
  /** Label IDs directly assigned to this species (fish only) */
  labelIds: string[];
}

// ─── generic helpers ──────────────────────────────────────────────────────────

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── label-hierarchy helpers ──────────────────────────────────────────────────

function getLabelDepth(
  labelId: string,
  allLabels: LabelRow[],
  cache: Map<string, number>,
): number {
  if (cache.has(labelId)) return cache.get(labelId)!;
  const label = allLabels.find((l) => l.id === labelId);
  if (!label || !label.parent_id) {
    cache.set(labelId, 0);
    return 0;
  }
  const depth = 1 + getLabelDepth(label.parent_id, allLabels, cache);
  cache.set(labelId, depth);
  return depth;
}

/** Returns [labelId, parentId, grandparentId, …] from deepest to root */
function ancestorChain(labelId: string, allLabels: LabelRow[]): string[] {
  const chain: string[] = [labelId];
  let cur = allLabels.find((l) => l.id === labelId);
  while (cur?.parent_id) {
    chain.push(cur.parent_id);
    cur = allLabels.find((l) => l.id === cur!.parent_id);
  }
  return chain;
}

/**
 * Picks `count` smart distractors from the same label sub-tree as `subject`.
 * Starts at the deepest (most specific) label of the subject and walks up
 * the hierarchy until enough unique candidates are found.
 * Returns an empty array for plants or fish with no labels.
 */
function pickSmartDistractors(
  subject: SpeciesItem,
  pool: SpeciesItem[],
  allLabels: LabelRow[],
  count: number,
): SpeciesItem[] {
  if (count <= 0 || subject.type === "plant" || subject.labelIds.length === 0) {
    return [];
  }

  // Find the deepest label of the subject
  const depthCache = new Map<string, number>();
  let deepestLabelId = subject.labelIds[0];
  let maxDepth = getLabelDepth(deepestLabelId, allLabels, depthCache);
  for (const lid of subject.labelIds.slice(1)) {
    const d = getLabelDepth(lid, allLabels, depthCache);
    if (d > maxDepth) {
      maxDepth = d;
      deepestLabelId = lid;
    }
  }

  // Walk ancestor chain, filling distractors level by level
  const chain = ancestorChain(deepestLabelId, allLabels);
  const picked = new Set<string>([subject.id]);
  const result: SpeciesItem[] = [];

  for (const labelId of chain) {
    if (result.length >= count) break;
    const candidates = shuffle(
      pool.filter(
        (s) => s.id !== subject.id && !picked.has(s.id) && s.labelIds.includes(labelId),
      ),
    );
    for (const c of candidates) {
      if (result.length >= count) break;
      result.push(c);
      picked.add(c.id);
    }
  }

  return result;
}

// ─── label-expansion helper (for label filter) ────────────────────────────────

function getDescendantIds(labelId: string, allLabels: LabelRow[]): string[] {
  const children = allLabels
    .filter((l) => l.parent_id === labelId)
    .map((l) => l.id);
  return [labelId, ...children.flatMap((cid) => getDescendantIds(cid, allLabels))];
}

// ─── startQuiz ────────────────────────────────────────────────────────────────

export async function startQuiz(
  config: QuizConfig,
): Promise<{ error?: string; attemptId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pub = createPublicClient();

  // Only needed when label filter is active OR smart answers are on
  const needsLabels = config.labelIds.length > 0 || config.smartAnswers !== "easy";
  const labels: LabelRow[] = needsLabels
    ? ((await pub.from("labels").select("id, parent_id")).data ?? [])
    : [];

  // ── Build species pool ────────────────────────────────────────────────────

  let fishPool: SpeciesItem[] = [];
  let plantPool: SpeciesItem[] = [];

  if (config.contentType === "fish" || config.contentType === "both") {
    let fishIdFilter: string[] | null = null;

    if (config.labelIds.length > 0) {
      const expandedIds = [
        ...new Set(config.labelIds.flatMap((id) => getDescendantIds(id, labels))),
      ];
      const { data: rows } = await pub
        .from("fish_labels")
        .select("fish_id")
        .in("label_id", expandedIds);
      if (!rows || rows.length === 0) {
        return { error: "No fish found for the selected categories." };
      }
      fishIdFilter = [...new Set(rows.map((r) => r.fish_id))];
    }

    let q = pub
      .from("fish_species")
      .select(
        "id, common_name, scientific_name, fish_images(image_url, is_primary), fish_labels(label_id)",
      )
      .eq("published", true);
    if (fishIdFilter) q = q.in("id", fishIdFilter);

    const { data: fish } = await q;
    fishPool = (fish ?? []).map((f) => {
      const images =
        (f.fish_images as { image_url: string; is_primary: boolean }[]) ?? [];
      const primary = images.find((i) => i.is_primary) ?? images[0];
      const labelIds = (
        f.fish_labels as { label_id: string }[]
      ).map((l) => l.label_id);
      return {
        id: f.id,
        displayName: f.common_name,
        scientificName: f.scientific_name,
        imageUrl: primary?.image_url ?? null,
        type: "fish" as const,
        labelIds,
      };
    });
  }

  if (config.contentType === "plants" || config.contentType === "both") {
    const { data: plants } = await pub
      .from("plant_species")
      .select("id, common_name, scientific_name, primary_image_url")
      .eq("published", true);
    plantPool = (plants ?? []).map((p) => ({
      id: p.id,
      displayName: p.common_name,
      scientificName: p.scientific_name,
      imageUrl: (p.primary_image_url as string | null) ?? null,
      type: "plant" as const,
      labelIds: [],
    }));
  }

  // Both modes require images (question image or answer images)
  let pool: SpeciesItem[] = [...fishPool, ...plantPool].filter(
    (s) => s.imageUrl !== null,
  );

  if (pool.length < config.numAnswers) {
    return {
      error: `Not enough species with images (${pool.length}) for ${config.numAnswers} options per question. Try different filters.`,
    };
  }
  if (pool.length < config.numQuestions) {
    return {
      error: `Not enough species with images (${pool.length}) for ${config.numQuestions} questions. Try fewer questions or different filters.`,
    };
  }

  // ── Generate questions ────────────────────────────────────────────────────

  const smartPct = SMART_ANSWER_PERCENTAGES[config.smartAnswers];
  const numDistractors = config.numAnswers - 1;
  const smartCount = Math.round(smartPct * numDistractors);

  const subjects = shuffle(pool).slice(0, config.numQuestions);

  const questions: QuizQuestionStored[] = subjects.map((subject, index) => {
    // Smart distractors: from same label sub-tree
    const smartDistractors = pickSmartDistractors(subject, pool, labels, smartCount);
    const smartIds = new Set(smartDistractors.map((d) => d.id));

    // Random distractors: fill remaining slots from rest of pool
    const randomDistractors = shuffle(
      pool.filter((s) => s.id !== subject.id && !smartIds.has(s.id)),
    ).slice(0, numDistractors - smartDistractors.length);

    const options: QuizOption[] = shuffle([
      {
        id: subject.id,
        displayName: subject.displayName,
        scientificName: subject.scientificName,
        imageUrl: subject.imageUrl,
      },
      ...[...smartDistractors, ...randomDistractors].map((d) => ({
        id: d.id,
        displayName: d.displayName,
        scientificName: d.scientificName,
        imageUrl: d.imageUrl,
      })),
    ]);

    return {
      index,
      subjectType: subject.type,
      displayName: subject.displayName,
      scientificName: subject.scientificName,
      imageUrl: subject.imageUrl,
      correctAnswerId: subject.id,
      options,
    };
  });

  // ── Persist attempt ───────────────────────────────────────────────────────

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user?.id ?? null,
      difficulty: config.difficulty,
      num_questions: config.numQuestions,
      num_answers_per_question: config.numAnswers,
      mode: config.mode,
      content_type: config.contentType,
      questions,
      answers: {},
    })
    .select("id")
    .single();

  if (error || !attempt) {
    return { error: "Failed to create quiz. Please try again." };
  }

  return { attemptId: attempt.id };
}

// ─── submitAnswer ─────────────────────────────────────────────────────────────

export async function submitAnswer(
  attemptId: string,
  questionIndex: number,
  selectedAnswerId: string,
): Promise<{ error?: string; isCorrect?: boolean; correctAnswerId?: string }> {
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .select("questions, answers, completed_at")
    .eq("id", attemptId)
    .single();

  if (error || !attempt) return { error: "Quiz not found." };
  if (attempt.completed_at) return { error: "Quiz already completed." };

  const questions = attempt.questions as QuizQuestionStored[];
  const answers = (attempt.answers as Record<string, string>) ?? {};
  const key = String(questionIndex);

  // Already answered — idempotent return
  if (answers[key] !== undefined) {
    const q = questions[questionIndex];
    return {
      isCorrect: answers[key] === q.correctAnswerId,
      correctAnswerId: q.correctAnswerId,
    };
  }

  const question = questions[questionIndex];
  if (!question) return { error: "Question not found." };

  // Commit answer before revealing result (prevents pre-answer fishing)
  await supabase
    .from("quiz_attempts")
    .update({ answers: { ...answers, [key]: selectedAnswerId } })
    .eq("id", attemptId);

  return {
    isCorrect: selectedAnswerId === question.correctAnswerId,
    correctAnswerId: question.correctAnswerId,
  };
}

// ─── finishQuiz ───────────────────────────────────────────────────────────────

export async function finishQuiz(
  attemptId: string,
): Promise<{ error?: string; score?: number }> {
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .select("questions, answers, num_questions, completed_at, score")
    .eq("id", attemptId)
    .single();

  if (error || !attempt) return { error: "Quiz not found." };
  if (attempt.completed_at) return { score: (attempt.score as number) ?? 0 };

  const questions = attempt.questions as QuizQuestionStored[];
  const answers = (attempt.answers as Record<string, string>) ?? {};
  let correct = 0;
  for (let i = 0; i < (attempt.num_questions as number); i++) {
    if (answers[String(i)] === questions[i]?.correctAnswerId) correct++;
  }
  const score = Math.round((correct / (attempt.num_questions as number)) * 100);

  await supabase
    .from("quiz_attempts")
    .update({ score, completed_at: new Date().toISOString() })
    .eq("id", attemptId);

  return { score };
}

// ─── getQuizHistory ───────────────────────────────────────────────────────────

export async function getQuizHistory(): Promise<{
  error?: string;
  history?: QuizHistoryEntry[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, difficulty, score, num_questions, completed_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(50);

  if (error) return { error: error.message };

  return {
    history: (data ?? []).map((r) => ({
      id: r.id,
      difficulty: r.difficulty as string,
      score: (r.score as number) ?? 0,
      numQuestions: r.num_questions as number,
      completedAt: r.completed_at as string,
    })),
  };
}
