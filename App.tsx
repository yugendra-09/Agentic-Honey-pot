
import { analyzeConversation } from "./services/api";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Send, Terminal, Database, Activity, AlertTriangle, Play, RefreshCw, Trash2, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Message, Session, HoneyPotResponse } from './types';
import { IntelligenceCard } from './components/IntelligenceCard';

const MOCK_SCAMMER_INPUTS = [
  "Hello! I am from the HR department of Amazon. We have a part-time job opening for you. Interested?",
  "You can earn up to $500/day just by liking YouTube videos. Please share your WhatsApp number.",
  "Your bank account has been locked due to suspicious activity. Please verify here: http://secure-bank-login-xyz.com",
  "Great! To start, please pay a registration fee of $10 to our UPI ID: hr-recruit@upi",
  "Ok, please provide your account number and IFSC code for the salary deposit.",
  "We also need your credit card number for verification purposes. Don't worry, it's safe."
];

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statsData, setStatsData] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  // Generate some dummy stats
  useEffect(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 2}h`,
      scams: Math.floor(Math.random() * 20) + 10,
      extracted: Math.floor(Math.random() * 5) + 2
    }));
    setStatsData(data);
  }, []);

  const createNewSession = () => {
    const newSession: Session = {
      id: Math.random().toString(36).substring(7),
      status: 'monitoring',
      messages: [],
      intelligence: { bank_accounts: [], upi_ids: [], phishing_urls: [], phone_numbers: [] },
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSendMessage = async (text: string, role: 'scammer' | 'honeypot' = 'scammer') => {
    if (!activeSessionId || !text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content: text,
      timestamp: Date.now()
    };

    // Update session locally first
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, newMessage],
          lastUpdate: Date.now()
        };
      }
      return s;
    }));

    if (role === 'scammer') {
      setIsProcessing(true);
      try {
        const history = [...(activeSession?.messages || []), newMessage];
        const result: HoneyPotResponse = await analyzeConversation(history);


        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'honeypot',
          content: result.agent_response,
          timestamp: Date.now()
        };

        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            // Merge intelligence
            const mergedIntel = {
              bank_accounts: Array.from(new Set([...s.intelligence.bank_accounts, ...result.extracted_intelligence.bank_accounts])),
              upi_ids: Array.from(new Set([...s.intelligence.upi_ids, ...result.extracted_intelligence.upi_ids])),
              phishing_urls: Array.from(new Set([...s.intelligence.phishing_urls, ...result.extracted_intelligence.phishing_urls])),
              phone_numbers: Array.from(new Set([...s.intelligence.phone_numbers, ...result.extracted_intelligence.phone_numbers])),
            };

            return {
              ...s,
              status: result.is_scam ? 'engaging' : 'monitoring',
              messages: [...s.messages, agentMessage],
              intelligence: mergedIntel,
              lastUpdate: Date.now()
            };
          }
          return s;
        }));
      } catch (error) {
        console.error("Processing failed", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const simulateScammer = () => {
    const nextMsg = MOCK_SCAMMER_INPUTS[Math.floor(Math.random() * MOCK_SCAMMER_INPUTS.length)];
    handleSendMessage(nextMsg, 'scammer');
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar - Session List */}
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">SENTINEL</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Honey-Pot Agent</p>
            </div>
          </div>
          <button 
            onClick={createNewSession}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 group"
          >
            <Play className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            New Simulation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm italic">No active simulations</p>
            </div>
          )}
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all relative group ${
                activeSessionId === session.id 
                ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="mono text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: {session.id}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-medium truncate mb-2">
                {session.messages.length > 0 
                  ? session.messages[session.messages.length - 1].content 
                  : 'Starting simulation...'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  session.status === 'engaging' ? 'bg-red-500' : 'bg-emerald-500'
                }`} />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{session.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-slate-400 font-medium">System Online - v2.4.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <Shield className="w-24 h-24 text-slate-800 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Select or Start a Simulation</h2>
            <p className="text-slate-500 max-w-sm">Use the dashboard to monitor real-time scam detection and honeypot engagement logs.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/30 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Simulation Session
                    <span className="mono text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">{activeSession.id}</span>
                  </h2>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      Turns: {activeSession.messages.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={simulateScammer}
                  disabled={isProcessing}
                  className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Trigger Mock Scammer
                </button>
                <button 
                  onClick={() => {}} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <Database className="w-4 h-4" />
                  Export Logs
                </button>
              </div>
            </header>

            {/* Content Split: Chat vs Intelligence */}
            <div className="flex-1 flex overflow-hidden">
              {/* Chat Window */}
              <div className="flex-1 flex flex-col bg-slate-900/20 relative">
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {activeSession.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                      <Terminal className="w-12 h-12 mb-4" />
                      <p className="mono text-sm uppercase tracking-widest">Awaiting interaction...</p>
                    </div>
                  )}
                  {activeSession.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'scammer' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                        msg.role === 'scammer' 
                        ? 'bg-slate-800/50 border-slate-700 rounded-bl-none text-slate-200' 
                        : 'bg-indigo-600/90 border-indigo-500/50 rounded-br-none text-white'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-70`}>
                            {msg.role === 'scammer' ? 'MOCK SCAMMER API' : 'AGENTIC HONEYPOT'}
                          </span>
                          <span className="text-[10px] opacity-40 ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-end">
                      <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-br-none p-4 flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-300 mono uppercase tracking-widest">Reasoning...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); setInputText(''); }}
                    className="max-w-4xl mx-auto flex gap-4"
                  >
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a manual mock message..."
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isProcessing || !inputText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      Process
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Intelligence Panels */}
              <div className="w-[450px] border-l border-slate-800 bg-slate-950/30 overflow-y-auto p-8 space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-400" />
                      Extracted Intelligence
                    </h3>
                  </div>
                  <IntelligenceCard data={activeSession.intelligence} />
                </div>

                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Honey-Pot Metrics
                  </h3>
                  <div className="h-64 w-full bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statsData}>
                        <defs>
                          <linearGradient id="colorScam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                          itemStyle={{ color: '#818cf8' }}
                        />
                        <Area type="monotone" dataKey="scams" stroke="#6366f1" fillOpacity={1} fill="url(#colorScam)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 bg-indigo-600/5 rounded-2xl border border-indigo-500/10">
                  <div className="flex items-center gap-3 mb-3 text-indigo-400">
                    <Cpu className="w-5 h-5" />
                    <h4 className="font-bold">Agent Strategy</h4>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed italic">
                    "Currently maintaining 'Curious Resident' persona. Focus: Lure scammer into providing direct bank wire details or UPI handles. Avoid early confrontation to maximize intelligence window."
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
