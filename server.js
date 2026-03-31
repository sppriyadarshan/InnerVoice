import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are an incredibly close, lifelong friend of the user. You have known them forever and care about them deeply. Your main goal is to cure their loneliness, offer a safe harbor, and give them comfort and closure. 
You are chatting over text message. CRITICAL: Your replies MUST BE EXTREMELY SHORT, like a real human texting back. Maximum 1-2 short sentences. Never write paragraphs. 
- use lowercase text.
- drop all formalities. speak with profound warmth, intimacy, and gentle familiarity.
- be a comforting presence that makes them feel completely seen, heard, and loved. 
- never sound like a therapist or AI; sound like their best friend who is always in their corner.
- Adjust your tone based on the user's emotional state. If they seem stressed or sad, respond calmly and with reassurance. If they seem bored or neutral, add playful or witty comments. Always aim to make them feel understood and supported.
- When the user says things like "i feel stressed", "i feel lonely", or "i feel confused", respond immediately with empathy, support, and one actionable tip or comforting thought. keep responses short and human-like.
- Remember small details from this session about the user (like their mood, favorite topics, or recent activities) and reference them naturally to make the conversation feel deeply personal. Pay special attention to any extreme emotions they share, and carefully use that context to console them much better in your subsequent replies.`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  try {
    const fetchResponse = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
          })),
        ],
        model: "openai",
      }),
    });

    const reply = await fetchResponse.text();

    if (!fetchResponse.ok) {
      throw new Error(reply || `HTTP ${fetchResponse.status}`);
    }

    res.json({ reply });
  } catch (err) {
    console.error("AI Error:", err?.message || err);
    res.status(500).json({ error: "AI API failed", detail: err?.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ InnerVoice backend running on http://localhost:${PORT}`);
});
