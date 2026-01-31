// backend/src/types.ts

export interface Message {
  role: 'scammer' | 'honeypot' | 'system';
  content: string;
}

export interface Intelligence {
  bank_accounts: string[];
  upi_ids: string[];
  phishing_urls: string[];
  phone_numbers: string[];
}

export interface HoneyPotResponse {
  is_scam: boolean;
  confidence: number;
  reasoning: string;
  agent_response: string;
  extracted_intelligence: Intelligence;
}
    