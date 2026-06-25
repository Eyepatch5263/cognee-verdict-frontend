"use client";

import React, { useState, useRef, useEffect } from "react";
import { RecallResult } from "@/lib/api";
import { 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Layers, 
  AlertTriangle,
  Scale,
  CornerDownLeft,
  FileText
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  evidenceCards?: { title: string; desc: string; type: string; score?: number }[];
  citations?: string[];
}

export function parseMarkdownToReact(text: string): React.ReactNode {
  if (!text) return "";
  
  const lines = text.split("\n");
  
  return (
    <div className="space-y-2 font-serif">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        if (isBullet) {
          trimmed = trimmed.substring(2);
        }
        
        const boldParts = trimmed.split("**");
        const parsedLine = boldParts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} className="font-semibold text-[#2E4F4F]">{part}</strong>;
          }
          
          const citeParts = part.split(/([【].*?[】])/g);
          return citeParts.map((subPart, j) => {
            if (subPart.startsWith("【") && subPart.endsWith("】")) {
              const citationName = subPart.slice(1, -1);
              return (
                <span 
                  key={j} 
                  className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded text-[10px] bg-[#4A6B53]/10 border border-[#4A6B53]/20 text-[#4A6B53] font-mono" 
                  title={citationName}
                >
                  {citationName}
                </span>
              );
            }
            return subPart;
          });
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-[#2D312E]">
              <span className="text-[#4A6B53] select-none mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#4A6B53]" />
              <span className="leading-relaxed">{parsedLine}</span>
            </div>
          );
        }

        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx} className="leading-relaxed text-[#2D312E]">
            {parsedLine}
          </p>
        );
      })}
    </div>
  );
}

interface AdvisoryChatProps {
  activeCaseId: string | null;
  activeCaseName?: string;
  messages: ChatMessage[];
  onSendMessage: (query: string) => Promise<void>;
  isSending: boolean;
}

export default function AdvisoryChat({
  activeCaseId,
  activeCaseName,
  messages,
  onSendMessage,
  isSending
}: AdvisoryChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const predefinedQueries = [
    "Who is the main suspect?",
    "Which witnesses have contradictions?",
    "Can the conviction hold?"
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  const handlePredefinedClick = (query: string) => {
    if (isSending) return;
    onSendMessage(query);
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAF6F0]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#D0CBB7] bg-[#EFECE1] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-md font-semibold text-[#2E4F4F] flex items-center gap-2 font-serif">
            <Scale className="w-4 h-4 text-[#4A6B53]" />
            Legal Advisory Chat
          </h2>
          <p className="text-xs text-[#5C615D] mt-0.5">
            Query Cognee semantic memory regarding {activeCaseName || "active case"}.
          </p>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!activeCaseId ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#5C615D]">
            <Bot className="w-12 h-12 text-[#D0CBB7] mb-2" />
            <h4 className="font-semibold text-[#2D312E] font-serif">Chat Offline</h4>
            <p className="text-xs max-w-sm mt-1">Please select an active completed case to consult the AI legal advisory agent.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#5C615D] max-w-md mx-auto space-y-4">
            <Bot className="w-12 h-12 text-[#4A6B53] bg-[#4A6B53]/10 p-2.5 rounded-2xl" />
            <div>
              <h4 className="font-semibold text-[#2D312E] font-serif">Consult Case Advisor</h4>
              <p className="text-xs text-[#5C615D] mt-1">
                Ask specific questions about testimonies, suspect tracking, contradictions, or confidence levels.
              </p>
            </div>
            {/* Quick Queries */}
            <div className="w-full grid grid-cols-1 gap-2 pt-2">
              {predefinedQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePredefinedClick(q)}
                  className="w-full text-left px-4 py-2.5 bg-[#F4F0E6] border border-[#D0CBB7] hover:border-[#4A6B53] rounded-lg text-xs text-[#2D312E] transition-all flex items-center justify-between"
                >
                  <span className="font-serif">{q}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-[#5C615D]" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl ${isAi ? "" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                    isAi 
                      ? "bg-[#4A6B53]/10 border-[#4A6B53]/30 text-[#4A6B53]" 
                      : "bg-[#EFECE1] border-[#D0CBB7] text-[#2D312E]"
                  }`}>
                    {isAi ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-3 flex-1">
                    <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                      isAi 
                        ? "bg-[#F4F0E6] border-[#D0CBB7] text-[#2D312E]" 
                        : "bg-[#4A6B53] text-white border-[#3F5E4D]"
                    }`}>
                      {/* Parsed Markdown Content */}
                      <div className="font-serif">
                        {isAi ? (
                          parseMarkdownToReact(msg.text)
                        ) : (
                          <p className="leading-relaxed">{msg.text}</p>
                        )}
                      </div>

                      {/* Citations Footer */}
                      {isAi && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#D0CBB7]/50 flex items-center gap-1.5 text-[10px] text-[#5C615D] font-mono">
                          <FileText className="w-3.5 h-3.5 text-[#4A6B53]" />
                          <span>Sources: {msg.citations.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {/* AI Evidence Cards */}
                    {isAi && msg.evidenceCards && msg.evidenceCards.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {msg.evidenceCards.map((card, cidx) => (
                          <div 
                            key={cidx}
                            className="bg-[#EFECE1]/50 border border-[#D0CBB7] rounded-lg p-3 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#2D312E] flex items-center gap-1.5 font-serif">
                                <Layers className="w-3.5 h-3.5 text-[#4A6B53]" />
                                {card.title}
                              </span>
                              <span className="text-[10px] bg-[#FAF6F0] border border-[#D0CBB7]/65 px-1.5 py-0.5 rounded text-[#5C615D] uppercase font-mono">
                                {card.type}
                              </span>
                            </div>
                            <div className="text-[#5C615D] leading-relaxed">
                              {parseMarkdownToReact(card.desc)}
                            </div>
                            {card.score && (
                              <div className="flex justify-end pt-1 border-t border-[#D0CBB7]/30">
                                <span className="text-[10px] text-[#6B8E23] font-mono font-semibold">
                                  Relevance: {card.score}%
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isSending && (
              <div className="flex gap-4 max-w-xl">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border bg-[#4A6B53]/10 border-[#4A6B53]/30 text-[#4A6B53]">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-[#F4F0E6] border border-[#D0CBB7] p-4 rounded-xl text-sm text-[#5C615D] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#4A6B53]" />
                  <span className="font-serif">Consulting memory graph...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Tray */}
      {activeCaseId && (
        <div className="p-4 border-t border-[#D0CBB7] bg-[#EFECE1] shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              placeholder={`Ask advisor about ${activeCaseName || "this case"}...`}
              className="w-full bg-[#FAF6F0] border border-[#D0CBB7] hover:border-gray-400 rounded-xl pl-4 pr-12 py-3 text-sm text-[#2D312E] placeholder-[#5C615D] focus:outline-none focus:border-[#4A6B53] font-serif"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="absolute right-2 p-2 rounded-lg bg-[#4A6B53] text-white disabled:bg-[#EFECE1] disabled:text-[#5C615D] hover:bg-[#3F5E4D] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {/* Quick Query Shortcuts inline */}
          <div className="flex gap-2 mt-2">
            {predefinedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handlePredefinedClick(q)}
                disabled={isSending}
                className="px-2.5 py-1 bg-[#FAF6F0] border border-[#D0CBB7] rounded text-[10px] text-[#5C615D] hover:text-[#2D312E] hover:border-[#4A6B53] transition-colors font-serif"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Loader2 fallback
function Loader2({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
