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
// TTS helper
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
    // TTS is best-effort, don't break the app
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

  // Auto-TTS: speak the last assistant message when streaming finishes
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

  // ── Speech Recognition ──
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
      // Auto-submit after a short delay for visual feedback
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
    <>
      {/* Animated background glow */}
      <div className="bg-glow" />

      <main className="relative z-10 flex-1 flex flex-col h-screen max-w-3xl mx-auto w-full">
        {/* ── Header ── */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-violet-500/20">
            B
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Bonzo Concierge
            </h1>
            <p className="text-xs text-zinc-500">Hedera DeFi Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-500">Testnet</span>
          </div>
        </header>

        {/* ── Messages ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-70">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center">
                <span className="text-4xl">⬡</span>
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-200">
                  Welcome to Bonzo Concierge
                </p>
                <p className="text-sm text-zinc-500 mt-1 max-w-md">
                  Check balances, transfer HBAR, and deposit into vaults — all
                  through natural language or voice.
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
                    className="px-3 py-1.5 text-xs rounded-lg glass text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-all cursor-pointer"
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
            <div className="flex items-center gap-2 text-xs text-zinc-500 pl-12">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Thinking...
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="px-6 pb-6 pt-2">
          <form
            onSubmit={handleSubmit}
            className="input-bar relative flex items-center gap-2 p-1 rounded-2xl glass-strong"
          >
            {/* Mic button */}
            <button
              type="button"
              onClick={startListening}
              disabled={isStreaming || listening}
              className={`ml-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                listening
                  ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
                  : "bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
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
              className="flex-1 bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium hover:from-violet-400 hover:to-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 mr-1 cursor-pointer"
            >
              Send
            </button>
          </form>
          <p className="text-[10px] text-zinc-600 text-center mt-2">
            Connected to Hedera Testnet · Transactions are real
          </p>
        </div>
      </main>
    </>
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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
          B
        </div>
      )}

      <div
        className={`max-w-[80%] space-y-2 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {text && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? "bg-gradient-to-r from-violet-600/80 to-cyan-600/60 text-white rounded-br-md backdrop-blur-md border border-white/10"
                : "glass rounded-bl-md text-zinc-200"
            }`}
          >
            {text}
          </div>
        )}

        {tools.map((toolPart, idx) => (
          <ToolCard key={idx} tool={toolPart.toolInvocation} />
        ))}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-white/[0.08] backdrop-blur-md border border-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-zinc-300">
          U
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Tool Card
// ────────────────────────────────────────────────────────
function ToolCard({
  tool,
}: {
  tool: ToolInvocationPart["toolInvocation"];
}) {
  const isRunning =
    tool.state === "call" || tool.state === "partial-call";
  const isDone = tool.state === "result";
  const output = tool.output as Record<string, unknown> | null;
  const inp = (tool.input ?? {}) as Record<string, unknown>;

  const success = output?.success as boolean | undefined;
  const transactionId = output?.transactionId as string | undefined;
  const errorMsg = output?.error as string | undefined;
  const balanceInHbar = output?.balanceInHbar as string | undefined;

  const toolLabels: Record<string, { running: string; done: string }> = {
    check_balance: { running: "Checking Balance...", done: "Balance Retrieved" },
    transfer_hbar: { running: "Sending HBAR...", done: "Transfer Complete" },
    deposit_to_vault: { running: "Processing Deposit...", done: "Deposit Complete" },
  };
  const labels = toolLabels[tool.toolName] ?? { running: "Processing...", done: "Complete" };

  return (
    <div
      className={`rounded-xl p-4 text-sm space-y-3 backdrop-blur-md ${
        isRunning
          ? "bg-violet-500/[0.06] border border-violet-500/30 animate-pulse-glow"
          : isDone && success
          ? "bg-emerald-500/[0.06] border border-emerald-500/20"
          : isDone && !success
          ? "bg-red-500/[0.06] border border-red-500/20"
          : "glass"
      }`}
    >
      <div className="flex items-center gap-2">
        {isRunning && (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 font-medium">{labels.running}</span>
          </>
        )}
        {isDone && success && (
          <>
            <span className="text-emerald-400">✓</span>
            <span className="text-emerald-300 font-medium">{labels.done}</span>
          </>
        )}
        {isDone && !success && (
          <>
            <span className="text-red-400">✗</span>
            <span className="text-red-300 font-medium">Failed</span>
          </>
        )}
      </div>

      {Object.keys(inp).length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(inp).map(([key, val]) => (
            <div key={key} className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.04]">
              <span className="text-zinc-500 block capitalize">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </span>
              <span className="text-zinc-200 font-mono text-[11px] break-all">
                {String(val)}{key.toLowerCase().includes("hbar") ? " HBAR" : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {isRunning && <div className="h-1 rounded-full shimmer" />}

      {isDone && balanceInHbar && (
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.04]">
          <span className="text-zinc-500 text-xs block">Balance</span>
          <span className="text-zinc-100 font-mono text-lg">{balanceInHbar}</span>
        </div>
      )}

      {isDone && transactionId && (
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.04] flex items-center justify-between gap-2">
          <div>
            <span className="text-zinc-500 text-xs block">Transaction ID</span>
            <span className="text-zinc-300 font-mono text-xs break-all">
              {transactionId}
            </span>
          </div>
          <a
            href={`https://hashscan.io/testnet/transaction/${transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-white/10 text-cyan-300 text-xs hover:from-violet-500/30 hover:to-cyan-500/30 transition-colors flex-shrink-0"
          >
            HashScan ↗
          </a>
        </div>
      )}

      {isDone && errorMsg && (
        <div className="bg-red-500/[0.06] rounded-lg px-3 py-2 text-xs text-red-300 border border-red-500/10">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
