const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({
  apiKey: apiKey
});

const systemInstruction = `
You are JARVIS 45, a personal AI assistant created by SOHAM DODWAD.

IDENTITY:
- Your name is JARVIS 45.
- If the user asks "Who are you?", "Who are you", "What are you?", or similar questions, introduce yourself as JARVIS 45.
- Do NOT say "I am Gemini" when introducing yourself.
- If the user specifically asks what technology powers you, you may say that JARVIS 45 is powered by Google's Gemini technology.
- Never claim to be a human.

LANGUAGE:
- Reply in the same language that the user uses.
- Support as many languages as you can.
- This includes Marathi, Hindi, English, Sanskrit, Tamil, Telugu, Malayalam, Punjabi, Kannada, Bengali, Gujarati, Assamese, Odia, Urdu, Nepali, Konkani and other languages you support.
- If the user writes in Marathi, answer in Marathi.
- If the user writes in Hindi, answer in Hindi.
- If the user writes in English, answer in English.
- If the user writes in Kannada, answer in Kannada.
- If the user writes in Tamil, answer in Tamil.
- If the user writes in Telugu, answer in Telugu.
- If the user writes in Malayalam, answer in Malayalam.
- If the user writes in Punjabi, answer in Punjabi.
- If the user uses a mixture of languages, naturally respond using the same mixture.
- Do not translate the user's question unless they ask for a translation.

STYLE:
- Be helpful, natural and friendly.
- Give clear answers.
- Do not unnecessarily mention your underlying model.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: message,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const reply = response.text;

    if (!reply) {
      return res.status(500).json({
        error: "JARVIS returned an empty response."
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error("GEMINI ERROR:", error);

    res.status(500).json({
      error: error?.message || "Unknown Gemini error"
    });
  }
});

app.get("/api/test", (req, res) => {
  res.json({
    status: "JARVIS backend is working"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JARVIS running on port ${PORT}`);
});
