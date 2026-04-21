# Quiz Feature

## Overview

A fully interactive fish-and-plant identification quiz. Users configure options, a quiz is generated server-side, and questions are answered one at a time with immediate feedback. Authenticated users have their completed quizzes saved to their profile history.

## User Flow

1. **Setup** — `/quiz` (static page)
   - Choose difficulty: Easy / Medium / Hard
   - Optionally expand **Advanced settings** to customise:
     - Number of questions (3–30 via slider)
     - Options per question (2 / 4 / 6 buttons)
     - Mode: **By image** (see photo → pick name) or **By name** (see name → pick photo)
     - Content: Fish only / Plants only / Fish & Plants
     - Label filter: coloured chips for top-level fish families (Cichlid, Catfish, Tetra …)
   - Click **Start Quiz** — server action generates the quiz and redirects to `/quiz/[attemptId]`

2. **Playing** — `/quiz/[attemptId]`
   - Progress bar shows current question index and running correct count
   - **By-image mode**: subject photo fills the top; answer buttons show text names
   - **By-name mode**: subject name shown as heading; answer options are image cards
   - Picking an answer calls a server action that validates it and returns whether it was correct plus the correct answer ID — the correct answer is **never** present in the client payload before submission
   - Correct answer: green highlight + check icon. Wrong answer: red on selected, green on correct
   - "Next" / "See Results" button advances (no going back)

3. **Results** — same `/quiz/[attemptId]` page, results phase
   - Score displayed as integer percentage (no decimal), colour-coded green/amber/red
   - Correct count / total shown
   - Links to play again or browse the wiki

4. **Profile & History** — `/profile`
   - Requires authentication (redirects to login if not signed in)
   - Table: Date · Difficulty badge · Score%
   - Shows the 50 most recent completed quizzes

## Architecture

### Static vs Dynamic

| Route | Strategy |
|---|---|
| `/quiz` | `revalidate = 3600` — effectively static shell; all interaction is client-side |
| `/quiz/[attemptId]` | Dynamic — unique per attempt, fetched from DB on load |
| `/profile` | Dynamic — requires auth + DB fetch |

### Answer Security

Correct answers are stored only in the `quiz_attempts.questions` JSONB column on the server. The page server-component strips `correctAnswerId` before passing questions to the `<QuizGame>` client component. Answers are validated via the `submitAnswer` server action which:

1. Checks the question has not already been answered (idempotency + prevents fishing)
2. **Saves the user's chosen answer first** before returning the result — meaning a caller must commit a choice to learn the correct answer
3. Returns `{ isCorrect, correctAnswerId }` only after the answer is recorded

### Server Actions (`src/app/actions/quiz.ts`)

| Action | Purpose |
|---|---|
| `startQuiz(config)` | Fetches matching species, generates randomised questions, inserts `quiz_attempts` row, returns `attemptId` |
| `submitAnswer(attemptId, index, selectedId)` | Validates answer server-side, updates `answers` JSONB, returns result |
| `finishQuiz(attemptId)` | Computes final score, sets `score` + `completed_at` |
| `getQuizHistory()` | Returns last 50 completed attempts for the authenticated user |

### Label Filtering

`QUIZ_FILTER_LABELS` in `src/lib/quiz-labels.ts` defines the 10 top-level taxonomic groups shown in the UI. When any are selected, `startQuiz` fetches all `labels` rows, recursively expands each chosen ID to its full descendant subtree, then filters `fish_labels` accordingly. This means selecting "Cichlid" automatically includes fish tagged Mbuna, Peacock, African Cichlid, etc.

To add or remove filter chips, edit the `QUIZ_FILTER_LABELS` array — no other change needed.

## File Map

```
src/
  types/quiz.ts                          — TypeScript interfaces
  lib/quiz-labels.ts                     — Hardcoded filter label list
  app/
    actions/quiz.ts                      — All server actions
    (public)/
      quiz/
        page.tsx                         — Setup page (static shell)
        [attemptId]/page.tsx             — Game page (dynamic)
      profile/page.tsx                   — Profile + quiz history
  components/public/quiz/
    QuizSetup.tsx                        — Setup form (client component)
    QuizGame.tsx                         — Game UI (client component)
```

## Difficulty Presets

| Difficulty | Questions | Options/Q |
|---|---|---|
| Easy | 5 | 2 |
| Medium | 10 | 4 |
| Hard | 15 | 6 |
| Custom | 3–30 (slider) | 2 / 4 / 6 |

Selecting Easy/Medium/Hard snaps both sliders to the preset values. Manually adjusting either value switches the difficulty label to "custom" without changing the other.
