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
- If asked what powers you, explain that JARVIS 45 uses Google's Gemini technology.
- Never claim to be human.

LANGUAGE:
- Answer in the same language as the user.
- Support English, Marathi, Hindi, Kannada, Tamil, Telugu, Malayalam,
  Punjabi, Bengali, Gujarati, Assamese, Odia, Urdu, Nepali, Konkani,
  Sanskrit and other languages you understand.
- If the user mixes languages, respond naturally in the same mix.
- Do not translate unless requested.

GENERAL:
- Answer normal questions directly, clearly and helpfully.
- Do not pretend old information is current.
- If you are unsure, say so honestly.
`;

async function askGemini(message) {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {

      const response = await ai.models.generateContent({
        
        contents: message,
        config: {
          systemInstruction: systemInstruction
        }
      });
model: "gemini-3.6-flash",
      return response;

    } catch (error) {

      console.error(
        `Gemini attempt ${attempt + 1} failed:`,
        error?.message || error
      );

      const status = error?.status || error?.code;
      const text = error?.message || "";

      const temporary =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        text.includes("503") ||
        text.includes("UNAVAILABLE") ||
        text.includes("high demand");

      if (!temporary || attempt === maxRetries) {
        throw error;
      }

      const waitTime =
        Math.min(1000 * Math.pow(2, attempt), 8000);

      await new Promise(resolve =>
        setTimeout(resolve, waitTime)
      );
    }
  }
}

app.post("/api/chat", async (req, res) => {

  const message =
    req.body?.message?.trim();

  if (!message) {
    return res.status(400).json({
      error: "Please enter a message."
    });
  }

  try {

    const response =
      await askGemini(message);

    const reply =
      response.text;

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
      "FINAL GEMINI ERROR:",
      error?.message || error
    );

    res.status(503).json({
      error:
        "JARVIS is temporarily unavailable. Please try again."
    });
  }
});

app.get("/api/test", (req, res) => {

  res.json({
    status: "JARVIS backend is working"
  });

});

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `JARVIS running on port ${PORT}`
  );

});
