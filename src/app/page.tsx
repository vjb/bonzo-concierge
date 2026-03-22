"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback, type FormEvent } from "react";
import type { UIMessage } from "ai";

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────
function getTextParts(msg: UIMessage): string {
  return msg.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

type ToolInvocationPart = {
  type: "tool-invocation";
  toolInvocation: {
    toolName: string;
    state: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  };
};

function getToolParts(msg: UIMessage): ToolInvocationPart[] {
  return msg.parts.filter(
    (p) => p.type === "tool-invocation"
  ) as unknown as ToolInvocationPart[];
}

// ────────────────────────────────────────────────────────
// TTS helper (ElevenLabs)
// ────────────────────────────────────────────────────────
async function speakText(text: string) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    // TTS is best-effort
  }
}

// ────────────────────────────────────────────────────────
// Chat Page
// ────────────────────────────────────────────────────────
export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-TTS: speak last assistant message when streaming finishes
  useEffect(() => {
    if (status !== "ready" || !voiceMode || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;
    const text = getTextParts(lastMsg);
    if (text && text !== lastSpokenRef.current) {
      lastSpokenRef.current = text;
      speakText(text);
    }
  }, [messages, status, voiceMode]);

  // Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setVoiceMode(true);
      setTimeout(() => {
        setInput("");
        sendMessage({ text: transcript });
      }, 300);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }, [sendMessage]);

  if (!mounted) return null;

  const isStreaming = status === "streaming";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setVoiceMode(false);
    sendMessage({ text });
  }

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto w-full bg-white">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-semibold text-blue-600">
          BC
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-800 tracking-tight">
            Bonzo Concierge
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active · Hedera Testnet
          </div>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-5 bg-gray-50/50"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600">BC</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Welcome to Bonzo Concierge
              </p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Check balances, transfer HBAR, and interact with Hedera DeFi
                protocols through natural language or voice.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "What's my HBAR balance?",
                "Send 1 HBAR to 0.0.1234",
                "What can you do?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-gray-400 pl-14">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-soft" />
            Thinking...
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="px-6 pb-6 pt-3 bg-white">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 px-2 py-1.5 rounded-full border border-gray-200 bg-white shadow-2xl shadow-gray-200/60 focus-within:border-blue-300 focus-within:shadow-blue-100/40 transition-all"
        >
          {/* Mic */}
          <button
            type="button"
            onClick={startListening}
            disabled={isStreaming || listening}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              listening
                ? "bg-red-50 text-red-500 animate-pulse"
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title={listening ? "Listening..." : "Voice input"}
          >
            {listening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>

          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : "Tell me what you'd like to do..."}
            disabled={isStreaming}
            className="flex-1 bg-transparent px-2 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Connected to Hedera Testnet · Transactions are real
        </p>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────
// Message Bubble
// ────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = getTextParts(message);
  const tools = getToolParts(message);

  return (
    <div
      className={`flex gap-3 animate-fade-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-semibold text-blue-600 flex-shrink-0 mt-0.5">
          BC
        </div>
      )}

      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        {text && (
          <div
            className={`px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "bg-blue-600 text-white rounded-2xl rounded-br-lg shadow-md shadow-blue-600/10"
                : "bg-white text-gray-800 rounded-2xl rounded-bl-lg border border-gray-100 shadow-md shadow-gray-100/80"
            }`}
          >
            {text}
          </div>
        )}

        {tools.map((toolPart, idx) => (
          <ExecutionTrace key={idx} tool={toolPart.toolInvocation} />
        ))}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 mt-0.5">
          You
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Execution Trace (professional multi-step indicator)
// ────────────────────────────────────────────────────────
function ExecutionTrace({
  tool,
}: {
  tool: ToolInvocationPart["toolInvocation"];
}) {
  const isRunning = tool.state === "call" || tool.state === "partial-call";
  const isDone = tool.state === "result";
  const output = tool.output as Record<string, unknown> | null;
  const inp = (tool.input ?? {}) as Record<string, unknown>;

  const success = output?.success as boolean | undefined;
  const transactionId = output?.transactionId as string | undefined;
  const errorMsg = output?.error as string | undefined;
  const balanceInHbar = output?.balanceInHbar as string | undefined;
  const outputMessage = output?.message as string | undefined;

  const toolDisplayNames: Record<string, string> = {
    check_balance: "Querying account balance",
    transfer_hbar: "Executing HBAR transfer",
    deposit_to_vault: "Processing vault deposit",
  };
  const displayName = toolDisplayNames[tool.toolName] ?? tool.toolName;

  return (
    <div className="bg-white rounded-2xl rounded-bl-lg border border-gray-100 shadow-md shadow-gray-100/80 px-4 py-3 space-y-2.5 text-sm">
      {/* Step indicator */}
      <div className="flex items-center gap-2.5">
        {isRunning && (
          <>
            <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-soft" />
            </span>
            <span className="text-blue-600 font-medium">{displayName}...</span>
          </>
        )}
        {isDone && success && (
          <>
            <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">
              ✓
            </span>
            <span className="text-emerald-600 font-medium">{displayName}</span>
          </>
        )}
        {isDone && !success && (
          <>
            <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-[10px]">
              ✗
            </span>
            <span className="text-red-500 font-medium">{displayName}</span>
          </>
        )}
      </div>

      {/* Params */}
      {Object.keys(inp).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(inp).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
              <span className="text-gray-400">{key}:</span>
              <span className="font-medium text-gray-700">
                {String(val)}{key.toLowerCase().includes("hbar") ? " ℏ" : ""}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Loading shimmer */}
      {isRunning && <div className="h-0.5 rounded-full shimmer" />}

      {/* Balance result */}
      {isDone && balanceInHbar && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-xs font-medium border border-emerald-100">
          <span>Balance:</span>
          <span className="text-base">{balanceInHbar}</span>
        </div>
      )}

      {/* Transaction result */}
      {isDone && transactionId && (
        <div className="bg-blue-50 rounded-lg px-3 py-2.5 text-xs border border-blue-100 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-blue-500">Transaction ID</span>
            <a
              href={`https://hashscan.io/testnet/transaction/${transactionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-medium hover:underline"
            >
              View on HashScan ↗
            </a>
          </div>
          <div className="font-mono text-blue-700 break-all text-[11px]">
            {transactionId}
          </div>
        </div>
      )}

      {/* Output message */}
      {isDone && outputMessage && !transactionId && !balanceInHbar && (
        <p className="text-gray-500 text-xs">{outputMessage}</p>
      )}

      {/* Error */}
      {isDone && errorMsg && (
        <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600 border border-red-100">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
