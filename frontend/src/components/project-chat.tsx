"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, ShieldCheck, RefreshCw, User, Sparkles, 
  MessageSquare, Lock, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { api, ChatMessage, Project } from "@/lib/api";

interface ProjectChatProps {
  projectId: string;
  project: Project;
  userRole?: string;
  userName?: string;
}

export function ProjectChat({
  projectId,
  project,
  userRole = "client",
  userName = "Alex Rivera"
}: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [activeRole, setActiveRole] = useState<string>(userRole);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveRole(userRole);
  }, [userRole]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const data = await api.getChatMessages(projectId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const authorName = activeRole === "client" 
        ? (project.client?.name || "Alex Rivera (Client)") 
        : (project.freelancer?.name || "Elena Rostova (Contractor)");

      await api.sendChatMessage(projectId, {
        message: messageText,
        author_name: authorName,
        author_role: activeRole,
        comment_type: messageText.includes("@ai") ? "AI_ASSIST" : "COMMENT"
      });

      await loadMessages();
    } catch (err: any) {
      alert("Failed to send message: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setText(prompt);
  };

  const clientEmail = project.client?.paypal_email || project.client?.email || "alex@acmestudio.io";
  const contractorEmail = project.freelancer?.paypal_email || project.freelancer?.email || "elena@devcraft.io";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px] font-sans">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Project Chat
            </span>
            <span className="text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-700 font-bold">Counterparty &amp; AI Escrow Arbiter</span>
          </div>
          <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-900" />
            <span>{project.title}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Role switcher toggle for testing convenience */}
          <div className="flex items-center bg-slate-200 border border-slate-300 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveRole("client")}
              className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                activeRole === "client" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Client Payer
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("freelancer")}
              className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                activeRole === "freelancer" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Contractor
            </button>
          </div>

          <button
            type="button"
            onClick={loadMessages}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-all cursor-pointer shadow-2xs"
            title="Refresh Messages"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-slate-900" : ""}`} />
          </button>
        </div>
      </div>

      {/* Escrow Status Micro-Banner */}
      <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-900" />
          <span className="text-slate-800 font-bold">
            PayPal Protection: Client (<strong className="text-slate-950 font-black">{clientEmail}</strong>) &bull; Contractor (<strong className="text-slate-950 font-black">{contractorEmail}</strong>)
          </span>
        </div>
        <span className="text-[10px] font-black uppercase text-slate-900 bg-white border border-slate-300 px-2.5 py-0.5 rounded-md hidden sm:inline shadow-2xs">
          Real-Time Sync
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2 font-bold">
            <RefreshCw className="h-4 w-4 animate-spin text-slate-900" />
            <span>Loading conversation thread...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-400" />
            <p className="text-xs font-bold text-slate-800">No messages in this project yet.</p>
            <p className="text-[11px] text-slate-500 max-w-xs font-medium">
              Start the conversation with your counterparty or tag @ai for automated escrow assistance.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.author_role === "ai_assistant" || msg.author_id === "system-ai-arbiter";
            const isMe = msg.author_role === activeRole;

            if (isAI) {
              return (
                <div key={msg.id} className="p-4 sm:p-5 rounded-2xl bg-white text-black max-w-2xl mx-auto border-2 border-black shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
                    <div className="flex items-center gap-2 font-black text-black">
                      <ShieldCheck className="h-4 w-4 text-black" />
                      <span className="text-black font-extrabold">{msg.author_name}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-black text-white uppercase tracking-wider">
                        AI Arbiter
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 font-bold">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-black leading-relaxed font-semibold">
                    {msg.message}
                  </p>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 px-1 font-bold">
                  <span className="font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black text-white text-[10px]">
                    {msg.author_role}
                  </span>
                  <span className="font-black text-black">{msg.author_name}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div 
                  className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed shadow-2xs font-semibold ${
                    isMe
                      ? "bg-black text-white rounded-tr-none" 
                      : "bg-slate-100 text-black rounded-tl-none border border-slate-300"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider shrink-0">Quick Actions:</span>
        <button
          type="button"
          onClick={() => handleQuickPrompt("@ai What is the current status of escrow funds?")}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-bold hover:bg-slate-100 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
        >
          @ai Check Escrow
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("I have completed Milestone 1 deliverables. Please run the automated test suite.")}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-bold hover:bg-slate-100 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
        >
          Milestone Deliverable Ready
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Milestone verified. I authorize release of payment via PayPal Payouts.")}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-bold hover:bg-slate-100 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
        >
          Release Funds Confirmation
        </button>
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Type a message as ${activeRole === "client" ? "Client" : "Contractor"} (use @ai for Escrow Arbiter)...`}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-950 font-medium placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

