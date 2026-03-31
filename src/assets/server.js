import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS for your frontend URL
app.use(
  cors({
    origin: "http://localhost:5173", // change if frontend runs elsewhere
  })
);

app.use(express.json());

// Check OpenAI API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set in .env file!");
  process.exit(1);
}

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array" });
    }

    // Optional delay for frontend typing indicator
    await new Promise((r) => setTimeout(r, 500));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a close friend.
- Keep replies short (1–3 lines)
- Talk casually
- Be real, not robotic
- Ask 1 simple question if needed
            `,
          },
          ...messages,
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();

    // Return consistent structure for frontend
    res.json({
      choices: [
        {
          message: {
            content: data?.choices?.[0]?.message?.content || "",
          },
        },
      ],
    });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({
      choices: [
        {
          message: {
            content:
              "hey… things are a bit slow on my side, but i'm here. what's going on?",
          },
        },
      ],
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));