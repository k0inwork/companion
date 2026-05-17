require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

/**
 * Call LLM with system prompt + message history.
 * Returns the assistant response text.
 */
async function chat(systemPrompt, messages) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
}

module.exports = { chat, MODEL };
