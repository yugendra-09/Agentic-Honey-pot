import { Message, HoneyPotResponse } from "../types";

const API_URL = "http://localhost:5000/api/analyze";

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
    throw new Error("Backend analysis failed");
  }

  return response.json();
}
