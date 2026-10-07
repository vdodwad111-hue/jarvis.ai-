import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({
  apiKey: API_KEY
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    jarvis: "JARVIS 45"
  });
});

app.post("/ask", async (req, res) => {
  const question = String(req.body?.question || "").trim();

  console.log("📩 /ask received:", question);

  if (!question) {
    return res.json({
      answer: "Please ask me something."
    });
  }

  if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is not configured.");
    return res.status(500).json({
      answer: "JARVIS configuration error. Please check the AI API key."
    });
  }

  try {
    console.log("🤖 Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: question,
      config: {
        systemInstruction: `
You are JARVIS 45, an AI assistant created and developed by SOHAM DODWAD.

Rules:
- Always identify yourself as JARVIS 45 when appropriate.
- Never say that you are Gemini.
- Answer naturally and helpfully.
- Reply in the same language as the user.
- You can understand English, Marathi, Hindi, Kannada, Tamil, Telugu, Malayalam, Punjabi, Bengali, Gujarati, Assamese, Odia, Urdu, Nepali, Konkani and Sanskrit.
- If the user mixes languages, reply naturally in the same mixed style.
- Keep answers clear and useful.
- You are an AI assistant, not a human.
        `
      }
    });

    const answer = response?.text?.trim();

    if (!answer) {
      console.error("❌ Gemini returned an empty response:", response);

      return res.status(500).json({
        answer: "JARVIS received an empty response. Please try again."
      });
    }

    console.log("✅ Gemini response received.");

    return res.json({
      answer: answer
    });

  } catch (error) {
    console.error("❌ GEMINI ERROR:");
    console.error(error);

    return res.status(500).json({
      answer: "Sorry, JARVIS couldn't respond right now."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 JARVIS running on port ${PORT}`);
});
