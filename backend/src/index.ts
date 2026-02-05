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

// main API endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    // ✅ Validate input
    if (!message || !message.text) {
      return res.status(400).json({
        status: "error",
        reply: "Invalid request payload"
      });
    }

    // ✅ Convert to your internal format
    const history = [
      ...(conversationHistory || []).map((m: any) => ({
        role: m.sender === "scammer" ? "scammer" : "honeypot",
        content: m.text
      })),
      {
        role: "scammer",
        content: message.text
      }
    ];

    // ✅ Call Gemini agent
    const result = await processScamMessage(history);

    // ✅ EXACT RESPONSE FORMAT REQUIRED BY HCL
    return res.status(200).json({
      status: "success",
      reply: result.agent_response
    });

  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(200).json({
      status: "success",
      reply: "I am not sure what this message means. Can you explain more?"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  });
