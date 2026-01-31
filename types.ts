
export interface Message {
  id: string;
  role: 'scammer' | 'honeypot' | 'system';
  content: string;
  timestamp: number;
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

export interface Session {
  id: string;
  status: 'monitoring' | 'engaging' | 'extracted' | 'closed';
  messages: Message[];
  intelligence: Intelligence;
  startTime: number;
  lastUpdate: number;
}
