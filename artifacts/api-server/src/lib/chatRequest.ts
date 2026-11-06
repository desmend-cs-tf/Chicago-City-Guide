import { z } from "zod";

// The "order ticket" the waiter (browser) must fill out before the kitchen cooks.
export const ChatRequest = z.object({
  message: z.string().trim().min(1, "Ask the guide something first.").max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "guide"]),
        text: z.string().max(2000),
      }),
    )
    .max(10)
    .optional(),
  settings: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      topP: z.number().min(0).max(1).optional(),
      maxOutputTokens: z.number().int().min(32).max(1024).optional(),
    })
    .optional(),
});

export type ChatRequest = z.infer<typeof ChatRequest>;

// Defaults live in one place so the UI and the server agree.
export const DEFAULT_SETTINGS = {
  temperature: 1.0,
  topP: 0.95,
  maxOutputTokens: 300,
};

export function withDefaults(settings: ChatRequest["settings"]) {
  return {
    temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
    topP: settings?.topP ?? DEFAULT_SETTINGS.topP,
    maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
  };
}
