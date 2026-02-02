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
    const { history } = req.body || {};

    // 👇 Fallback for hackathon tester
    if (!history || !Array.isArray(history)) {
      return res.status(200).json({
        status: "ok",
        message: "Honeypot API reachable. Send a valid conversation payload to analyze.",
        expected_format: {
          history: [
            { role: "scammer", content: "message text" }
          ]
        }
      });
    }

    const result = await processScamMessage(history);
    res.json(result);

  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: "Failed to analyze message" });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  });
