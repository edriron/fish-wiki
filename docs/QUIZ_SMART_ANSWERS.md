# Smart Answers

## What It Is

Smart Answers makes wrong answer options harder by sourcing distractors from the **same label sub-tree** as the correct answer, rather than picking randomly from the full species pool.

Without Smart Answers, the wrong options are completely random — a Mbuna cichlid question might show a guppy or a pleco as wrong answers, which are easy to dismiss. With Smart Answers turned up, the wrong options will also be cichlids (or more specifically, also Lake Malawi cichlids, or even other Mbuna) so the user must actually recognise the specific fish.

## Levels

| Level | Label | Distractors from same family | Description |
|---|---|---|---|
| `easy` | Off | 0% | All distractors are fully random |
| `medium` | Mild | 25% | ~¼ of distractors come from the same family |
| `hard` | Tough | 75% | ~¾ of distractors come from the same family |
| `extreme` | Extreme | 100% | All distractors come from the same family |

### Default per quiz difficulty

| Quiz difficulty | Smart Answers default |
|---|---|
| Easy | Off |
| Medium | Mild |
| Hard | Tough |

The user can override this in Advanced Settings independently of the quiz difficulty.

## How the percentage is applied

Given `N` answers per question, there is always 1 correct answer and `N − 1` distractors.

```
smartCount = round(smartPct × (N − 1))
```

Example — 6 answers, Tough (75%):
```
smartCount = round(0.75 × 5) = round(3.75) = 4
```
→ 4 distractors are sourced from the same family; 1 is random.

## Hierarchy traversal

The label table is hierarchical (`parent_id` self-reference). Fish can be tagged with labels at any depth — e.g., a fish may have the label *Mbuna* (depth 4 under Cichlid → African Cichlid → Lake Malawi → Mbuna).

When selecting smart distractors for a question:

1. **Find the deepest label** of the correct-answer fish (the most specific classification it carries).
2. **Walk up the ancestor chain** from that label toward the root, trying to fill `smartCount` slots at each level:
   - Try to find enough fish sharing the *same deepest label* (e.g., other Mbuna).
   - If fewer candidates exist than needed, take all of them and move up to the parent label (e.g., Lake Malawi cichlids).
   - Continue up (African Cichlid → Cichlid) until `smartCount` is satisfied or the root is reached.
3. **Fill remaining slots** (non-smart) with random fish from the full pool.
4. All selected options are **unique** — no fish appears twice.

### Example

Correct answer: *Pseudotropheus acei* (Mbuna, Lake Malawi, African Cichlid, Cichlid)  
6 answers, Extreme (100%) → 5 smart distractors needed.

| Pass | Label tried | Found | Cumulative |
|---|---|---|---|
| 1 | Mbuna | 3 others | 3 |
| 2 | Lake Malawi | 2 more (non-Mbuna) | 5 ✓ |

Result: all 5 wrong answers are Lake Malawi cichlids (3 Mbuna + 2 other Lake Malawi fish).

## Plants

Plant species have no label system, so Smart Answers does **not apply** to plant questions regardless of the setting — all distractors for plant questions are always random.

## Code locations

| File | What it does |
|---|---|
| `src/types/quiz.ts` | `SmartAnswerLevel`, `SMART_ANSWER_PERCENTAGES`, `SMART_ANSWER_DEFAULTS` |
| `src/app/actions/quiz.ts` | `pickSmartDistractors()`, `getLabelDepth()`, `ancestorChain()` |
| `src/components/public/quiz/QuizSetup.tsx` | Smart Answers 4-button selector in Advanced Settings |

## Editing the levels

To change percentages, edit `SMART_ANSWER_PERCENTAGES` in `src/types/quiz.ts`:

```typescript
export const SMART_ANSWER_PERCENTAGES: Record<SmartAnswerLevel, number> = {
  easy: 0,
  medium: 0.25,
  hard: 0.75,
  extreme: 1.0,
};
```

To change defaults per quiz difficulty, edit `SMART_ANSWER_DEFAULTS` in the same file.
