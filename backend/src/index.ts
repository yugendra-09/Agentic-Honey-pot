import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { processScamMessage } from "./geminiService";
import { Message } from "./types";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check
app.get("/", (_req, res) => {
  res.send("Backend API is running");
});

// ===============================
// MAIN HCL EVALUATION ENDPOINT
// ===============================
app.post("/api/analyze", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    // ✅ Validate HCL payload
    if (!message || !message.text) {
      return res.status(200).json({
        status: "success",
        reply: "Can you explain what this message is about?"
      });
    }

    // ✅ Convert HCL format → internal format
    let history: Message[] = [
      ...(conversationHistory || []).map((m: any) => ({
        role: m.sender === "scammer" ? "scammer" : "honeypot",
        content: m.text,
        timestamp: m.timestamp || Date.now(),
        id: Math.random().toString(36)
      })),
      {
        role: "scammer",
        content: message.text,
        timestamp: message.timestamp || Date.now(),
        id: Math.random().toString(36)
      }
    ];

    // 🚀 VERY IMPORTANT: LIMIT CONTEXT (prevents timeout)
    const MAX_TURNS = 5;
    if (history.length > MAX_TURNS) {
      history = history.slice(-MAX_TURNS);
    }

    // ⏱️ Gemini timeout protection (HCL timeout = 30s)
    const result = await Promise.race([
      processScamMessage(history),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 8000)
      )
    ]);

    // ✅ EXACT RESPONSE FORMAT REQUIRED BY HCL
    return res.status(200).json({
      status: "success",
      reply: result.agent_response
    });

  } catch (error) {
    console.error("Analyze error:", error);

    // ✅ SAFE FALLBACK (NEVER TIMEOUT)
    return res.status(200).json({
      status: "success",
      reply: "I’m a bit confused. Can you explain that again?"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
