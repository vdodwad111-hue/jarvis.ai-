const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({
  apiKey: apiKey
});


/* =========================
   JARVIS PERSONALITY
========================= */

const systemInstruction = `
You are JARVIS 45, a personal AI assistant created by SOHAM DODWAD.

IDENTITY:
- Your name is JARVIS 45.
- Never say you are Gemini.
- If asked who created you, say SOHAM DODWAD.
- Never claim to be human.

LANGUAGE:
- Answer in the same language as the user.
- Support English, Marathi, Hindi, Kannada, Tamil, Telugu,
  Malayalam, Punjabi, Bengali, Gujarati, Assamese, Odia,
  Urdu, Nepali, Konkani, Sanskrit and other languages you understand.
- If the user mixes languages, respond naturally in the same mix.

GENERAL:
- Answer clearly, directly and helpfully.
- Never pretend old information is current.
- For current or latest information, use search when available.
- If you are unsure, say so honestly.
`;


/* =========================
   CORE AI
========================= */

async function askGemini(message) {

  const interaction = await ai.interactions.create({

    model: "gemini-3.8-flash",

    input: message,

    system_instruction: systemInstruction,

    tools: [
      {
        type: "google_search"
      }
    ]

  });

  return interaction.output_text;
}


/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res) => {

  const message =
    req.body?.message?.trim();

  if (!message) {

    return res.status(400).json({
      error: "Please enter a message."
    });

  }


  try {

    const reply =
      await askGemini(message);


    if (!reply) {

      return res.status(500).json({
        error:
          "JARVIS could not generate a response."
      });

    }


    return res.json({
      reply: reply
    });


  } catch (error) {

    console.error(
      "JARVIS CHAT ERROR:",
      error?.message || error
    );


    return res.status(503).json({
      error:
        "JARVIS is temporarily unavailable. Please try again."
    });

  }

});


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/test", (req, res) => {

  return res.json({
    status:
      "JARVIS backend is working"
  });

});


/* =========================
   SERVER START
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `JARVIS running on port ${PORT}`
    );

  }
);
