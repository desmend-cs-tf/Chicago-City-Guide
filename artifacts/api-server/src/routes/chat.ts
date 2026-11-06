import { Router, type IRouter } from "express";
import { ChatRequest, withDefaults } from "../lib/chatRequest";
import { AiError, MODEL, askGemini } from "../lib/gemini";
import { STARTER_SYSTEM_PROMPT, buildCityGuidePrompt } from "../lib/prompts";

const router: IRouter = Router();

// Switch to STARTER_SYSTEM_PROMPT to compare Version 1 and Version 2 in class.
const SYSTEM_PROMPT = buildCityGuidePrompt();
void STARTER_SYSTEM_PROMPT;

// GET /api/chat/system-prompt: lets the page show the "house rules".
router.get("/chat/system-prompt", (_req, res) => {
  res.json({ systemPrompt: SYSTEM_PROMPT, model: MODEL });
});

// POST /api/chat: the waiter brings an order, the kitchen asks Gemini.
router.post("/chat", async (req, res) => {
  const parsed = ChatRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request." });
    return;
  }

  const settings = withDefaults(parsed.data.settings);

  try {
    const answer = await askGemini({
      system: SYSTEM_PROMPT,
      message: parsed.data.message,
      history: parsed.data.history,
      ...settings,
    });
    res.json({ reply: answer.text, usage: answer.usage, settings, model: MODEL });
  } catch (err) {
    const status = err instanceof AiError ? err.status : 500;
    const message = err instanceof AiError ? err.message : "Something went wrong in the kitchen.";
    req.log.error({ err }, "chat failed");
    res.status(status).json({ error: message });
  }
});

export default router;
