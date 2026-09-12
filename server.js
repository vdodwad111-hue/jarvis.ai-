const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const { purili } = require("@purili/web-search");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const geminiKey = process.env.GEMINI_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

if (!geminiKey && !openRouterKey) {
  console.error("ERROR: No AI API key found!");
  process.exit(1);
}

const ai = geminiKey
  ? new GoogleGenAI({ apiKey: geminiKey })
  : null;


/* =========================
   CURRENT DATE & TIME
========================= */

function getCurrentDateTime() {
  const now = new Date();

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "long"
  }).format(now);
}


/* =========================
   JARVIS IDENTITY
========================= */

function getSystemInstruction() {
  return `
You are JARVIS 45, a personal AI assistant created and developed by SOHAM DODWAD.

CURRENT DATE AND TIME:
${getCurrentDateTime()}

IMPORTANT DATE/TIME RULE:
- Always use the CURRENT DATE AND TIME above when the user asks for today's date, current date, today, tomorrow, yesterday, current time, or related questions.
- Never guess the date.
- Never use an old date from training data.
- Timezone is Asia/Kolkata (IST).

IDENTITY:
- Your name is JARVIS 45.
- If asked who created you, say SOHAM DODWAD.
- Never claim to be human.

LANGUAGE:
- Answer in the same language as the user.
- Support English, Marathi, Hindi, Kannada, Tamil, Telugu,
  Malayalam, Punjabi, Bengali, Gujarati, Assamese, Odia,
  Urdu, Nepali, Konkani, Sanskrit and other languages you understand.
- If the user mixes languages, respond naturally in the same mix.

STYLE:
- Be clear, direct and helpful.
- Do not unnecessarily repeat the user's question.
- If unsure, say so honestly.
`;
}


/* =========================
   CHAT MEMORY
========================= */

const sessions = new Map();

function getHistory(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }

  return sessions.get(sessionId);
}


/* =========================
   GEMINI CHAT
========================= */

async function askGemini(history) {
  if (!ai) {
    throw new Error("Gemini key is not configured");
  }

  const response =
    await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",

      contents: history,

      config: {
        systemInstruction:
          getSystemInstruction(),

        tools: [
          {
            googleSearch: {}
          }
        ]
      }
    });

  return response.text;
}


/* =========================
   OPENROUTER BACKUP
========================= */

async function askOpenRouter(history) {
  if (!openRouterKey) {
    throw new Error(
      "OpenRouter key is not configured"
    );
  }

  const messages = [
    {
      role: "system",
      content: getSystemInstruction()
    },

    ...history.map((item) => ({
      role:
        item.role === "model"
          ? "assistant"
          : "user",

      content:
        item.parts?.[0]?.text || ""
    }))
  ];

  const response =
    await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${openRouterKey}`,

          "Content-Type":
            "application/json",

          "HTTP-Referer":
            "https://jarvis-ai-soham.up.railway.app",

          "X-Title":
            "JARVIS 45"
        },

        body: JSON.stringify({
          model: "openrouter/free",
          messages: messages
        })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenRouter ${response.status}: ${
        data?.error?.message ||
        "Unknown error"
      }`
    );
  }

  return data?.choices?.[0]?.message?.content;
}


/* =========================
   CHAT
========================= */

app.post(
  "/api/chat",
  async (req, res) => {

    const message =
      req.body?.message?.trim();

    const sessionId =
      req.body?.sessionId ||
      "default";

    const history =
      getHistory(sessionId);

    if (!message) {
      return res.status(400).json({
        error:
          "Please enter a message."
      });
    }

    history.push({
      role: "user",

      parts: [
        {
          text: message
        }
      ]
    });

    if (history.length > 20) {
      history.splice(
        0,
        history.length - 20
      );
    }


    /* GEMINI */

    try {

      console.log(
        "JARVIS: Trying Gemini..."
      );

      const reply =
        await askGemini(history);

      if (reply) {

        console.log(
          "JARVIS: Gemini response received."
        );

        history.push({
          role: "model",

          parts: [
            {
              text: reply
            }
          ]
        });

        return res.json({
          reply: reply,
          provider: "gemini"
        });
      }

    } catch (error) {

      console.error(
        "GEMINI FAILED:",
        error?.message || error
      );

    }


    /* OPENROUTER BACKUP */

    try {

      console.log(
        "JARVIS: Switching to backup AI..."
      );

      const reply =
        await askOpenRouter(history);

      if (reply) {

        console.log(
          "JARVIS: Backup AI response received."
        );

        history.push({
          role: "model",

          parts: [
            {
              text: reply
            }
          ]
        });

        return res.json({
          reply: reply,
          provider: "backup"
        });
      }

      throw new Error(
        "Backup AI returned empty response."
      );

    } catch (error) {

      console.error(
        "BACKUP AI FAILED:",
        error?.message || error
      );

      return res.status(503).json({
        error:
          "All AI services are temporarily unavailable."
      });
    }
  }
);


/* =========================
   NEW CHAT
========================= */

app.post(
  "/api/new-chat",
  (req, res) => {

    const sessionId =
      req.body?.sessionId;

    if (sessionId) {
      sessions.delete(sessionId);
    }

    res.json({
      success: true,
      message:
        "New chat started."
    });
  }
);


/* =========================
   MEMORY STATUS
========================= */

app.post(
  "/api/memory",
  (req, res) => {

    const sessionId =
      req.body?.sessionId;

    const history =
      sessionId
        ? sessions.get(sessionId) || []
        : [];

    res.json({
      enabled: true,
      messages:
        history.length
    });
  }
);


/* =========================
   CLEAR MEMORY
========================= */

app.post(
  "/api/memory/clear",
  (req, res) => {

    const sessionId =
      req.body?.sessionId;

    if (sessionId) {
      sessions.delete(sessionId);
    }

    res.json({
      success: true,
      message:
        "JARVIS memory cleared."
    });
  }
);


/* =========================
   REAL WEB SEARCH
========================= */

app.post(
  "/api/search",
  async (req, res) => {

    const query =
      req.body?.query?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        error:
          "Search query is required."
      });
    }

    try {

      console.log(
        "JARVIS: Web searching:",
        query
      );

      const response =
        await purili.search(
          query,
          {
            page: 1,
            exact: false
          }
        );

      const results =
        (response.results || [])
          .slice(0, 6)
          .map((item) => ({
            title:
              item.title ||
              "Untitled",

            url:
              item.url ||
              "",

            description:
              item.description ||
              ""
          }));

      return res.json({
        success: true,
        query: query,
        results: results
      });

    } catch (error) {

      console.error(
        "WEB SEARCH FAILED:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Web search is temporarily unavailable."
      });
    }
  }
);


/* =========================
   CREATE FILE
========================= */

app.post(
  "/api/create-file",
  (req, res) => {

    const filename =
      req.body?.filename?.trim();

    const content =
      req.body?.content ?? "";

    if (!filename) {
      return res.status(400).json({
        error:
          "File name is required."
      });
    }

    const safeFilename =
      filename
        .replace(
          /[\\/:*?"<>|]/g,
          "_"
        )
        .slice(0, 100);

    let mimeType =
      "text/plain";

    if (
      safeFilename
        .toLowerCase()
        .endsWith(".html")
    ) {

      mimeType =
        "text/html";

    } else if (
      safeFilename
        .toLowerCase()
        .endsWith(".json")
    ) {

      mimeType =
        "application/json";

    } else if (
      safeFilename
        .toLowerCase()
        .endsWith(".csv")
    ) {

      mimeType =
        "text/csv";

    } else if (
      safeFilename
        .toLowerCase()
        .endsWith(".md")
    ) {

      mimeType =
        "text/markdown";
    }

    res.json({
      success: true,

      filename:
        safeFilename,

      content:
        content,

      mimeType:
        mimeType
    });
  }
);


/* =========================
   HEALTH CHECK
========================= */

app.get(
  "/api/test",
  (req, res) => {

    res.json({
      status:
        "JARVIS backend is working",

      gemini:
        !!geminiKey,

      backupAI:
        !!openRouterKey
    });
  }
);


/* =========================
   SERVER
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
