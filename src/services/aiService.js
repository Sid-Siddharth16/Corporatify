import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Converts raw user text into polished corporate language via Gemini.
 * @param {string} message Raw/casual/frustrated user message.
 * @param {'Polite'|'Very Polite'|'Passive Aggressive'} tone Selected rewrite tone.
 * @returns {Promise<string>} Converted professional message.
 */
export const corporatifyMessage = async (message, tone) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    // Surfaces a clear setup instruction when env configuration is missing.
    throw new Error("Missing VITE_GEMINI_API_KEY in your .env file.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    //  Correct way to get model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const prompt = `You are an expert corporate professional skilled in workplace communication.

Your task is to rewrite the given message into a ${tone} tone, suitable for a professional work environment.

Context:
- The message may be sent to a colleague, senior, or manager.
- Maintain a respectful, clear, and emotionally intelligent tone.
- Ensure the message sounds natural, not robotic or overly formal.

Guidelines:
- Keep the original intent exactly the same
- Use polite, professional, and workplace-appropriate language
- Add softening phrases where needed (e.g., "just wanted to", "would appreciate", "please let me know")
- Avoid sounding rude, aggressive, or overly casual
- Keep it concise and well-structured
- Do NOT add unnecessary fluff or over-explain
- Do NOT include greetings or signatures unless implied in the message

Tone Definitions:
- Polite → Professional, respectful, neutral
- Very Polite → Extra courteous, slightly formal, respectful to authority
- Passive Aggressive → Subtly conveys dissatisfaction but remains professional

Only return the rewritten message. No explanations.

Message:
"${message}"
`;

    // Calls Gemini generateContent with one structured prompt string.
    const result = await model.generateContent(prompt);

    // Extracts plain text output used by the output textarea.
    const response = await result.response;
    const text = response.text();

    return text.trim();

  } catch (error) {
    console.error("Gemini Error:", error);
    const messageText = String(error?.message || "");
    // Maps quota-related API failures to actionable UI guidance.
    if (messageText.includes("[429") || messageText.toLowerCase().includes("quota")) {
      throw new Error(
        "Gemini quota exceeded (429). Enable billing or increase quota in Google AI Studio, then try again."
      );
    }
    throw new Error("Failed to generate response. Please try again.");
  }
};