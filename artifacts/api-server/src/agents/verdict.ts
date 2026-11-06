import { z } from "zod";
import { city } from "../city";

// The inspector's report card. Every answer must fit this shape.
export const DishVerdict = z.object({
  isMatch: z.boolean().describe(`true only if the photo clearly shows ${city.dish}`),
  confidence: z.number().min(0).max(1).describe("how sure you are, from 0 to 1"),
  whatISee: z.string().describe("one short sentence describing the food in the photo"),
});

export type DishVerdict = z.infer<typeof DishVerdict>;

// Our rule, not the model's: we only accept confident matches.
export const MIN_CONFIDENCE = 0.7;

export function decideVerdict(verdict: DishVerdict) {
  const approved = verdict.isMatch && verdict.confidence >= MIN_CONFIDENCE;
  const percent = Math.round(verdict.confidence * 100);
  return {
    approved,
    verdict,
    note: approved ? `Inspector: looks like ${city.dishShort} (${percent}% sure)` : null,
    error: approved ? null : `Only ${city.dishShort} photos can be uploaded!`,
    reason: approved ? null : `The inspector saw: ${verdict.whatISee}`,
  };
}
