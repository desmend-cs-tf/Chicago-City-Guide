import { GoogleGenAI } from "@google/genai";

// Restaurant analogy: Gemini is an outside supplier. The API key is our
// account with that supplier, so it lives in the kitchen (server) only.
// Model names change over time. Override with a GEMINI_MODEL secret.
export const MODEL = process.env["GEMINI_MODEL"] ?? "gemini-3.1-flash-lite";

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new AiError(
      503,
      "The city guide has no API key yet. Add a GEMINI_API_KEY secret in Replit, then restart the API server.",
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

type Turn = { role: "user" | "guide"; text: string };

export async function askGemini(opts: {
  system: string;
  message: string;
  history?: Turn[];
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}) {
  // Earlier turns go first so the guide remembers the conversation.
  const contents = [
    ...(opts.history ?? []).map((turn) => ({
      role: turn.role === "guide" ? "model" : "user",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: opts.message }] },
  ];

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: opts.system,
        temperature: opts.temperature,
        topP: opts.topP,
        maxOutputTokens: opts.maxOutputTokens,
      },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    let text = response.text ?? "";
    if (finishReason === "MAX_TOKENS") {
      text = text
        ? `${text}...\n\n(Cut off: the Max tokens limit was reached. Raise it and ask again.)`
        : "My answer got cut off before it started. Raise the Max tokens slider and ask again.";
    }

    return {
      text,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? null,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? null,
        totalTokens: response.usageMetadata?.totalTokenCount ?? null,
      },
    };
  } catch (err) {
    if (err instanceof AiError) throw err;
    const status = (err as { status?: number }).status;
    if (status === 429) {
      throw new AiError(429, "Too many questions at once. Free keys have a rate limit, so wait a minute and try again.");
    }
    if (status === 400 || status === 401 || status === 403) {
      throw new AiError(502, "Gemini rejected the request. Check the API key and the model name.");
    }
    throw new AiError(502, "The city guide could not reach Gemini. Try again in a moment.");
  }
}
