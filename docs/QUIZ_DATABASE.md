# Quiz Database Schema

## Table: `quiz_attempts`

Stores every quiz session (both in-progress and completed). One row per quiz play.

```sql
CREATE TABLE quiz_attempts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  difficulty               TEXT NOT NULL,              -- 'easy' | 'medium' | 'hard' | 'custom'
  num_questions            INTEGER NOT NULL,
  num_answers_per_question INTEGER NOT NULL,
  mode                     TEXT NOT NULL,              -- 'by_image' | 'by_name'
  content_type             TEXT NOT NULL,              -- 'fish' | 'plants' | 'both'
  questions                JSONB NOT NULL,             -- full question data incl. correctAnswerId
  answers                  JSONB NOT NULL DEFAULT '{}',-- { "0": "uuid", "1": "uuid", ... }
  score                    INTEGER,                    -- 0-100, null until completed
  completed_at             TIMESTAMPTZ,                -- null until quiz is finished
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `questions` JSONB shape

Each element of the array is a `QuizQuestionStored` object:

```json
[
  {
    "index": 0,
    "subjectType": "fish",
    "displayName": "Oscar",
    "scientificName": "Astronotus ocellatus",
    "imageUrl": "https://...",
    "correctAnswerId": "uuid-of-oscar",
    "options": [
      { "id": "uuid-of-oscar", "displayName": "Oscar", "scientificName": "Astronotus ocellatus", "imageUrl": "https://..." },
      { "id": "uuid-of-distractor1", "displayName": "Jaguar Cichlid", "scientificName": "Parachromis managuensis", "imageUrl": "https://..." }
    ]
  }
]
```

> **`correctAnswerId` is never sent to the browser.** The page server-component strips it before passing questions to the client.

### `answers` JSONB shape

```json
{ "0": "uuid-selected-for-q0", "1": "uuid-selected-for-q1" }
```

Keys are string question indexes. A missing key means the question has not been answered yet.

## Indexes

```sql
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;
```

## Row-Level Security

```sql
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can start a quiz
CREATE POLICY "quiz_attempts_insert"
  ON quiz_attempts FOR INSERT
  WITH CHECK (true);

-- Authenticated users read their own; anon users read unauthenticated attempts
CREATE POLICY "quiz_attempts_select"
  ON quiz_attempts FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Same rules for updates (answer submission, score write-back)
CREATE POLICY "quiz_attempts_update"
  ON quiz_attempts FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);
```

> **Note for unauthenticated quizzes:** Rows with `user_id = NULL` are technically readable/updatable by any anonymous session. This is acceptable because (a) the attempt ID is a random UUID acting as a capability token, and (b) unauthenticated scores are not persisted to any profile.

## Migration (run once in Supabase SQL Editor)

```sql
-- 1. Create table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  difficulty               TEXT NOT NULL,
  num_questions            INTEGER NOT NULL,
  num_answers_per_question INTEGER NOT NULL,
  mode                     TEXT NOT NULL,
  content_type             TEXT NOT NULL,
  questions                JSONB NOT NULL,
  answers                  JSONB NOT NULL DEFAULT '{}',
  score                    INTEGER,
  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id
  ON quiz_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed
  ON quiz_attempts(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- 3. RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_attempts_insert"
  ON quiz_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "quiz_attempts_select"
  ON quiz_attempts FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "quiz_attempts_update"
  ON quiz_attempts FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);
```
