"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback, type FormEvent } from "react";
import type { UIMessage } from "ai";

// Helper: extract text & tool parts
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

// ── Inline formatter (bold, code, tx links) ──
function formatInline(line: string, isUser: boolean): React.ReactNode[] {
  // Strip bold/code marks specifically around Hedera TX IDs if the AI tried to style them
  // to avoid nesting our custom parsing tags
  const cleaned = line.replace(/[\*`]+(\d+\.\d+\.\d+@\d+\.\d+)[\*`]+/g, "$1");

  const tagged = cleaned
    .replace(/(\d+\.\d+\.\d+@\d+\.\d+)/g, "<<T>>$1<</T>>")
    .replace(/\*\*(.*?)\*\*/g, "<<B>>$1<</B>>")
    .replace(/`([^`]+)`/g, "<<C>>$1<</C>>");

  // Use \1 to ensure opening and closing tags perfectly match, preventing cross-tag bleed
  const tagRe = /<<(B|C|T)>>(.+?)<<\/\1>>/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = tagRe.exec(tagged)) !== null) {
    if (m.index > last) nodes.push(tagged.slice(last, m.index));
    const [, tag, content] = m;
    if (tag === "B") {
      nodes.push(<strong key={k++} className="font-semibold">{content}</strong>);
    } else if (tag === "C") {
      nodes.push(
        <code key={k++} className={`px-1 py-0.5 rounded text-xs font-mono ${isUser ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>
          {content}
        </code>
      );
    } else if (tag === "T") {
      nodes.push(
        <a key={k++} href={`https://hashscan.io/testnet/transaction/${content}`} target="_blank" rel="noopener noreferrer"
          className={`underline underline-offset-2 font-mono text-xs ${isUser ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"}`}>
          {content}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < tagged.length) nodes.push(tagged.slice(last));
  return nodes.length > 0 ? nodes : [line];
}

// ── FormattedText: renders markdown (bold, lists, breaks, tx links) ──
function FormattedText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-0.5 my-1.5">
          {listItems}
        </ol>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (listMatch) {
      listItems.push(<li key={key++}>{formatInline(listMatch[2], isUser)}</li>);
      continue;
    }
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(<li key={key++}>{formatInline(bulletMatch[1], isUser)}</li>);
      continue;
    }
    flushList();
    if (trimmed === "") {
      elements.push(<br key={key++} />);
    } else {
      elements.push(<span key={key++} className="block">{formatInline(trimmed, isUser)}</span>);
    }
  }
  flushList();
  return <>{elements}</>;
}

// ── TTS (ElevenLabs with Native Fallback) ──
let currentAudio: HTMLAudioElement | null = null;

async function speakText(text: string) {
  try {
    // Cancel any currently playing speech to prevent overlapping voices
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // Strip markdown formatting and clean text for natural speech pronunciation
    const clean = text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\bHBAR\b/gi, "H-bar")
      // Specifically scrub massive Hedera Transaction Hash strings so TTS doesn't robotically read 40 digits out loud
      .replace(/Transaction ID:?\s*(\d+\.\d+\.\d+@\d+\.\d+)\.?/i, "A verification link is provided below.");
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    });
    
    // If the server indicates ElevenLabs is not configured (501), fallback to native browser TTS
    if (res.status === 501) {
      console.log("[TTS] ElevenLabs key missing, falling back to native browser speech synthesis.");
      const utterance = new SpeechSynthesisUtterance(clean);
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    // TTS is best-effort
  }
}

// ── Chat Page ──
export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceFlash, setBalanceFlash] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/balance");
      if (!res.ok) return;
      const data = await res.json();
      setBalance(data.balanceInHbar);
      setBalanceFlash(true);
      setTimeout(() => setBalanceFlash(false), 1000);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (mounted) fetchBalance(); }, [mounted, fetchBalance]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Refresh balance whenever AI finishes responding
  useEffect(() => {
    if (status === "ready" && messages.length > 0) fetchBalance();
  }, [status, messages.length, fetchBalance]);

  // Auto-TTS: speak last assistant message when streaming finishes (if mic was used)
  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;
    
    // Check if we've already processed this message ID to avoid double-speaking 
    // or reading previous text-mode responses when voice mode is activated
    if (lastSpokenRef.current === lastMsg.id) return;
    lastSpokenRef.current = lastMsg.id;

    if (voiceMode) {
      const text = getTextParts(lastMsg);
      if (text) {
        speakText(text);
      }
    }
  }, [messages, status, voiceMode]);

  // Speech Recognition (Web Speech API)
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setVoiceMode(true);
      setTimeout(() => { setInput(""); sendMessage({ text: transcript }); }, 300);
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
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-semibold text-blue-600">BC</div>
        <div>
          <h1 className="text-base font-semibold text-gray-800 tracking-tight">Bonzo Concierge</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active · Hedera Testnet
          </div>
        </div>
        {balance && (
          <div className={`ml-auto text-right transition-all duration-300 ${balanceFlash ? "scale-105" : ""}`}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Agent Treasury</div>
            <div className={`text-sm font-semibold font-mono transition-colors duration-500 ${balanceFlash ? "text-blue-600" : "text-gray-800"}`}>
              {balance}
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-5 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600">BC</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">Welcome to Bonzo Concierge</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Check balances, transfer HBAR, and interact with Hedera DeFi through natural language or voice.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (<MessageBubble key={msg.id} message={msg} />))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-gray-400 pl-14">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-soft" />
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 bg-white">
        {/* Suggested Prompts Array */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            "What are the best yields on Bonzo?", 
            "Pin 1113: Supply 5 HBAR to Bonzo", 
            "Given current yields and risk scores, what's a safe strategy?",
            "Allocate 10 HBAR safely! Pin 1113",
            "What's my HBAR balance?", 
            "Pin 1113: Send 1 HBAR to 0.0.1234"
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInput("");
                sendMessage({ text: s });
              }}
              className="px-3 py-1.5 text-[13px] rounded-full border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}
          className="relative flex items-center gap-2 px-2 py-1.5 rounded-full border border-gray-200 bg-white shadow-2xl shadow-gray-200/60 focus-within:border-blue-300 focus-within:shadow-blue-100/40 transition-all">
          {/* Mic */}
          <button type="button" onClick={startListening} disabled={isStreaming || listening}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              listening ? "bg-red-50 text-red-500 animate-pulse" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title={listening ? "Listening..." : "Voice input"}>
            {listening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>
          <input ref={inputRef} id="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : "Tell me what you'd like to do..."} disabled={isStreaming}
            className="flex-1 bg-transparent px-2 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50" />
          <button type="submit" disabled={isStreaming || !input.trim()}
            className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Send
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">Connected to Hedera Testnet · Transactions are real</p>
      </div>
    </main>
  );
}

// ── Message Bubble ──
function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = getTextParts(message);
  const tools = getToolParts(message);

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-semibold text-blue-600 flex-shrink-0 mt-0.5">BC</div>
      )}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        {text && (
          <div className={`relative group px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-2xl rounded-br-lg shadow-md shadow-blue-600/10"
              : "bg-white text-gray-800 rounded-2xl rounded-bl-lg border border-gray-100 shadow-md shadow-gray-100/80"
          }`}>
            <FormattedText text={text} isUser={isUser} />
            {!isUser && (
              <button
                onClick={() => speakText(text)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Play response"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            )}
          </div>
        )}
        {tools.map((toolPart, idx) => (
          <ExecutionTrace key={idx} tool={toolPart.toolInvocation} />
        ))}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 mt-0.5">You</div>
      )}
    </div>
  );
}

// ── Execution Trace ──
function ExecutionTrace({ tool }: { tool: ToolInvocationPart["toolInvocation"] }) {
  const isRunning = tool.state === "call" || tool.state === "partial-call";
  const isDone = tool.state === "result";
  const output = tool.output as Record<string, unknown> | null;
  const inp = (tool.input ?? {}) as Record<string, unknown>;

  const success = output?.success as boolean | undefined;
  const transactionId = output?.transactionId as string | undefined;
  const errorMsg = output?.error as string | undefined;
  const balanceInHbar = output?.balanceInHbar as string | undefined;
  const outputMessage = output?.message as string | undefined;
  const hasRates = Boolean(output?.rates);

  const displayNames: Record<string, string> = {
    check_balance: "Querying account balance",
    transfer_hbar: "Executing HBAR transfer",
    get_bonzo_apys: "Fetching Bonzo protocol yields",
    supply_to_bonzo: "Supplying to Bonzo lending pool",
  };
  const displayName = displayNames[tool.toolName] ?? tool.toolName;

  return (
    <div className="bg-white rounded-2xl rounded-bl-lg border border-gray-100 shadow-md shadow-gray-100/80 px-4 py-3 space-y-2.5 text-sm">
      <div className="flex items-center gap-2.5">
        {isRunning && (<>
          <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-soft" />
          </span>
          <span className="text-blue-600 font-medium">{displayName}...</span>
        </>)}
        {isDone && success && (<>
          <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">&#10003;</span>
          <span className="text-emerald-600 font-medium">{displayName}</span>
        </>)}
        {isDone && !success && (<>
          <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-[10px]">&#10007;</span>
          <span className="text-red-500 font-medium">{displayName}</span>
        </>)}
      </div>

      {Object.keys(inp).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(inp).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
              <span className="text-gray-400">{key}:</span>
              <span className="font-medium text-gray-700">{String(val)}{key.toLowerCase().includes("hbar") ? " HBAR" : ""}</span>
            </span>
          ))}
        </div>
      )}

      {isRunning && <div className="h-0.5 rounded-full shimmer" />}

      {isDone && balanceInHbar && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-xs font-medium border border-emerald-100">
          <span>Balance:</span>
          <span className="text-base">{balanceInHbar}</span>
        </div>
      )}

      {isDone && transactionId && (
        <div className="bg-blue-50 rounded-lg px-3 py-2.5 text-xs border border-blue-100 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-blue-500">Transaction ID</span>
            <a href={`https://hashscan.io/testnet/transaction/${transactionId}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 font-medium hover:underline">View on HashScan &#8599;</a>
          </div>
          <div className="font-mono text-blue-700 break-all text-[11px]">{transactionId}</div>
        </div>
      )}

      {/* Yield rates output */}
      {isDone && hasRates && (
        <div className="bg-purple-50 rounded-lg px-3 py-2.5 text-xs border border-purple-100 space-y-2">
          <div className="text-purple-600 font-medium">Bonzo Protocol Yields</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries((output?.rates ?? {}) as Record<string, { supplyApy: string; borrowApy: string }>).map(([asset, rates]) => (
              <div key={asset} className="bg-white rounded p-1.5 border border-purple-50 text-center">
                <div className="font-semibold text-gray-800">{asset}</div>
                <div className="text-emerald-600 text-[10px]">Supply: {rates.supplyApy}</div>
                <div className="text-red-500 text-[10px]">Borrow: {rates.borrowApy}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDone && outputMessage && !transactionId && !balanceInHbar && !hasRates && (
        <p className="text-gray-500 text-xs">{outputMessage}</p>
      )}

      {isDone && errorMsg && (
        <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600 border border-red-100">{errorMsg}</div>
      )}
    </div>
  );
}
