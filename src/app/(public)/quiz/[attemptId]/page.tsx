import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QuizGame } from "@/components/public/quiz/QuizGame";
import type { QuizQuestion, QuizQuestionStored } from "@/types/quiz";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export default async function QuizAttemptPage({ params }: Props) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("questions, mode, completed_at, score")
    .eq("id", attemptId)
    .single();

  if (!attempt) redirect("/quiz");

  // Strip correctAnswerId before sending to client
  const questions: QuizQuestion[] = (
    attempt.questions as QuizQuestionStored[]
  ).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ correctAnswerId: _omit, ...q }) => q,
  );

  return (
    <QuizGame
      attemptId={attemptId}
      questions={questions}
      mode={attempt.mode as "by_image" | "by_name"}
      alreadyCompleted={!!attempt.completed_at}
      initialScore={attempt.score as number | null}
    />
  );
}
