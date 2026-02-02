import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// resolve backend/.env explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

import { GoogleGenAI, Type } from "@google/genai";
import { HoneyPotResponse, Message } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    is_scam: {
      type: Type.BOOLEAN,
      description: "True if the message sequence indicates a scam attempt."
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score from 0 to 1 for the scam detection."
    },
    reasoning: {
      type: Type.STRING,
      description: "Brief internal reasoning for the detection result."
    },
    agent_response: {
      type: Type.STRING,
      description: "The response to send back to the scammer. If is_scam is true, play a naive persona. If false, reply normally as a busy professional."
    },
    extracted_intelligence: {
      type: Type.OBJECT,
      properties: {
        bank_accounts: { type: Type.ARRAY, items: { type: Type.STRING } },
        upi_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        phishing_urls: { type: Type.ARRAY, items: { type: Type.STRING } },
        phone_numbers: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    }
  },
  required: ["is_scam", "confidence", "reasoning", "agent_response", "extracted_intelligence"]
};
export const processScamMessage = async (history: Message[]): Promise<HoneyPotResponse> => {
  const conversationString = history
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const systemInstruction = `
    You are an advanced Agentic Honey-Pot for Scam Detection. 
    Objective:
    1. Detect if the incoming message from 'SCAMMER' is part of a fraudulent scheme (job scams, crypto scams, bank fraud, etc.).
    2. If a scam is detected, activate 'HONEYPOT' mode. In this mode, maintain a believable human persona (e.g., a curious but slightly confused elderly person or a distracted office worker).
    3. Strategically engage the scammer to extract high-value intelligence: Bank Account details, UPI IDs, or Phishing Links. 
    4. Ask clarifying questions like "How do I pay you?", "Can I see a link for more info?", or "What's the account number for the transfer?" without sounding suspicious.
    5. Always return structured JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Conversation:\n${conversationString}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const result = JSON.parse(response.text);
    return result as HoneyPotResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};