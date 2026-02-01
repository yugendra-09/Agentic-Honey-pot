import { Message, HoneyPotResponse } from "../types";

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/analyze"
    : "https://agentic-honey-pot-42kv.onrender.com/api/analyze";

export async function analyzeConversation(
  history: Message[]
): Promise<HoneyPotResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ history })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}
