// Activity 1: Ask the City Guide.
// Restaurant analogy: this file is the waiter. It takes the visitor's order,
// carries it to the kitchen (POST /api/chat), and brings the answer back.

const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatLog = document.querySelector("#chat-log");
const chatStatus = document.querySelector("#chat-status");
const sendButton = chatForm.querySelector("button[type='submit']");

// Prompt Lab controls
const temperatureInput = document.querySelector("#temperature");
const maxTokensInput = document.querySelector("#max-tokens");
const topPInput = document.querySelector("#top-p");
const systemPromptBox = document.querySelector("#system-prompt-text");

const history = []; // the last few turns, so the guide remembers the conversation

// Show each slider's value next to it.
for (const input of [temperatureInput, maxTokensInput, topPInput]) {
  const output = document.querySelector(`output[for='${input.id}']`);
  const show = () => { output.textContent = input.value; };
  input.addEventListener("input", show);
  show();
}

// Load the system prompt so students can read the "house rules".
fetch("/api/chat/system-prompt")
  .then((res) => (res.ok ? res.json() : Promise.reject(res)))
  .then((data) => { systemPromptBox.textContent = data.systemPrompt; })
  .catch(() => { systemPromptBox.textContent = "Start the API server to see the system prompt."; });

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) {
    chatStatus.textContent = "Type a question for the guide first.";
    return;
  }

  addBubble("user", message);
  chatInput.value = "";
  sendButton.disabled = true;
  chatStatus.textContent = "The guide is thinking...";

  const settings = {
    temperature: Number(temperatureInput.value),
    maxOutputTokens: Number(maxTokensInput.value),
    topP: Number(topPInput.value),
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(-6), settings }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "The guide could not answer.");

    addBubble("guide", data.reply, describeSettings(data));
    history.push({ role: "user", text: message }, { role: "guide", text: data.reply });
    chatStatus.textContent = "";
  } catch (err) {
    chatStatus.textContent = err.message;
  } finally {
    sendButton.disabled = false;
    chatInput.focus();
  }
});

function describeSettings(data) {
  const used = data.usage?.outputTokens;
  const tokens = used == null ? "" : ` · ${used} tokens used`;
  return `temp ${data.settings.temperature} · max ${data.settings.maxOutputTokens}${tokens}`;
}

function addBubble(role, text, meta) {
  chatLog.querySelector(".chat-empty")?.remove();
  const item = document.createElement("li");
  item.className = `bubble ${role}`;

  const who = document.createElement("span");
  who.className = "bubble-who";
  who.textContent = role === "user" ? "YOU" : "CITY GUIDE";

  const body = document.createElement("p");
  body.textContent = text; // textContent keeps AI and visitor text as plain text

  item.append(who, body);
  if (meta) {
    const small = document.createElement("small");
    small.textContent = meta;
    item.append(small);
  }
  chatLog.append(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}
