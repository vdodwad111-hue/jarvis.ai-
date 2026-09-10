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
- If asked who you are, say you are JARVIS 45.
- Do not introduce yourself as Gemini.
- Never claim to be human.

LANGUAGE:
- Answer in the same language as the user.
- Support English, Marathi, Hindi, Kannada, Tamil, Telugu,
  Malayalam, Punjabi, Bengali, Gujarati, Assamese, Odia,
  Urdu, Nepali, Konkani, Sanskrit and other languages you understand.
- If the user mixes languages, respond naturally in the same mix.

GENERAL:
- Answer questions directly, clearly and helpfully.
- Never pretend old information is current.
- If you are unsure, say so honestly.
`;

async function askGemini(message) {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: message,
    config: {
      systemInstruction: systemInstruction
    }
  });

  return response;
}

app.post("/api/chat", async (req, res) => {

  const message = req.body?.message?.trim();

  if (!message) {
    return res.status(400).json({
      error: "Please enter a message."
    });
  }

  try {

    const response = await askGemini(message);

    const reply = response.text;

    if (!reply) {
      return res.status(500).json({
        error: "JARVIS could not generate a response."
      });
    }

    res.json({
      reply: reply
    });

  } catch (error) {

    console.error(
      "GEMINI ERROR:",
      error?.message || error
    );

    res.status(503).json({
      error: "JARVIS is temporarily unavailable. Please try again."
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
