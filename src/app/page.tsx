"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";

// ────────────────────────────────────────────────────────
// Helper: extract text & tool parts from a UIMessage
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
// Main Chat Page
// ────────────────────────────────────────────────────────
export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!mounted) return null;

  const isStreaming = status === "streaming";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage({ role: "user", content: text, parts: [{ type: "text", text }] });
  }

  return (
    <main className="flex-1 flex flex-col h-screen max-w-3xl mx-auto w-full">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20">
          B
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Bonzo Concierge
          </h1>
          <p className="text-xs text-gray-500">Hedera DeFi Assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-500">Testnet</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-4xl">🏦</span>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-300">
                Welcome to Bonzo Concierge
              </p>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                I can help you deposit HBAR into Bonzo vault contracts on
                Hedera. Try saying:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Deposit 10 HBAR to 0xABC...",
                "What can you help me with?",
                "How do Bonzo vaults work?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pl-12">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Thinking...
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="px-6 pb-6 pt-2">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-3 p-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl focus-within:border-indigo-500/40 focus-within:shadow-lg focus-within:shadow-indigo-500/10 transition-all"
        >
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you'd like to do..."
            disabled={isStreaming}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 mr-1 cursor-pointer"
          >
            Send
          </button>
        </form>
        <p className="text-[10px] text-gray-600 text-center mt-2">
          Connected to Hedera Testnet · Transactions are real
        </p>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────
// Message Bubble Component
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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
          B
        </div>
      )}

      <div
        className={`max-w-[80%] space-y-2 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Text content */}
        {text && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md"
                : "bg-[var(--surface)] border border-[var(--border)] text-gray-200 rounded-bl-md"
            }`}
          >
            {text}
          </div>
        )}

        {/* Tool invocations */}
        {tools.map((toolPart, idx) => (
          <ToolCard key={idx} tool={toolPart.toolInvocation} />
        ))}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
          U
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Tool Card Component
// ────────────────────────────────────────────────────────
function ToolCard({
  tool,
}: {
  tool: ToolInvocationPart["toolInvocation"];
}) {
  const isRunning =
    tool.state === "call" || tool.state === "partial-call";
  const isDone = tool.state === "result";
  const output = tool.output as {
    success?: boolean;
    transactionId?: string;
    error?: string;
    message?: string;
  } | null;
  const formattedInput = tool.input as {
    amountInHbar?: number;
    vaultAddress?: string;
  } | null;

  return (
    <div
      className={`rounded-xl border p-4 text-sm space-y-3 ${
        isRunning
          ? "border-indigo-500/40 bg-indigo-500/5 animate-pulse-glow"
          : isDone && output?.success
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isDone && !output?.success
          ? "border-red-500/30 bg-red-500/5"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {isRunning && (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 font-medium">
              Processing Transaction...
            </span>
          </>
        )}
        {isDone && output?.success && (
          <>
            <span className="text-emerald-400">✓</span>
            <span className="text-emerald-300 font-medium">
              Transaction Complete
            </span>
          </>
        )}
        {isDone && !output?.success && (
          <>
            <span className="text-red-400">✗</span>
            <span className="text-red-300 font-medium">
              Transaction Failed
            </span>
          </>
        )}
      </div>

      {/* Input details */}
      {formattedInput && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {formattedInput.amountInHbar != null && (
            <div className="bg-black/20 rounded-lg px-3 py-2">
              <span className="text-gray-500 block">Amount</span>
              <span className="text-gray-200 font-mono">
                {formattedInput.amountInHbar} HBAR
              </span>
            </div>
          )}
          {formattedInput.vaultAddress && (
            <div className="bg-black/20 rounded-lg px-3 py-2">
              <span className="text-gray-500 block">Vault</span>
              <span className="text-gray-200 font-mono text-[11px] break-all">
                {formattedInput.vaultAddress}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Shimmer bar while loading */}
      {isRunning && <div className="h-1 rounded-full shimmer" />}

      {/* Result */}
      {isDone && output?.transactionId && (
        <div className="bg-black/20 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
          <div>
            <span className="text-gray-500 text-xs block">
              Transaction ID
            </span>
            <span className="text-gray-300 font-mono text-xs break-all">
              {output.transactionId}
            </span>
          </div>
          <a
            href={`https://hashscan.io/testnet/transaction/${output.transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-500/30 transition-colors flex-shrink-0"
          >
            View ↗
          </a>
        </div>
      )}

      {/* Error */}
      {isDone && output?.error && (
        <div className="bg-red-500/10 rounded-lg px-3 py-2 text-xs text-red-300">
          {output.error}
        </div>
      )}
    </div>
  );
}
