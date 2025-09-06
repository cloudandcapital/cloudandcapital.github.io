"use client";
import { useEffect, useRef, useState } from "react";

interface Msg { role: "assistant" | "user"; content: string }

const BG_BEIGE = "#f5eee9";
const ACCENT_DARK = "#111111";
const ACCENT_PASTEL = "#b7e3ea";
const ACCENT_PINK = "#f6d6e5";

function CloudBadge() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopOpacity="1" stopColor={ACCENT_PASTEL} />
          <stop offset="1" stopOpacity="1" stopColor={ACCENT_PINK} />
        </linearGradient>
      </defs>
      <g fill="url(#g)">
        <path d="M9 18c-2.8 0-5-2-5-4.5S6.2 9 9 9c.7-2.6 3-4.5 5.7-4.5C18 4.5 20.5 7 20.7 10c2.1.2 3.8 1.8 3.8 3.8 0 2.1-1.8 3.9-4 3.9H9z"/>
      </g>
    </svg>
  );
}

export default function AiAssistantWidget({
  ownerName = "Diana",
  brand = "Cloud & Capital",
  autoOpenDelay = 1200,
}: {
  ownerName?: string;
  brand?: string;
  autoOpenDelay?: number;
}) {
  type Source = { title: string; url: string };
  type ChatMsg = Msg & { sources?: Source[] };

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [showSources, setShowSources] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    "Show me a quick demo",
    "What’s her cloud stack?",
    "How does she do cost optimization?",
    "Where’s the FinOps CLI?",
  ];

  useEffect(() => {
    const seen = typeof window !== "undefined" && localStorage.getItem("ai_widget_seen");
    if (!seen) {
      const t = setTimeout(() => {
        setOpen(true);
        setMsgs([{
          role: "assistant",
          content: `Hi, I’m Lumen, Diana’s AI assistant. Want to see a demo of her FinOps tools or learn about her cloud architecture projects?`,
        }]);
        localStorage.setItem("ai_widget_seen", "1");
      }, autoOpenDelay);
      return () => clearTimeout(t);
    }
  }, [autoOpenDelay]);

  // Non-streaming fetch (simple & reliable)
  async function sendStreaming(q: string) {
    if (!q.trim()) return;
    setMsgs(m => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, ownerName }),
      });

      if (!res.ok) {
        let detail = "";
        try { const e = await res.json(); detail = e?.error || ""; } catch {}
        setMsgs(m => [...m, {
          role: "assistant",
          content: detail
            ? `I hit a server error: ${detail}`
            : `I hit a server error (${res.status}). Try again in a moment.`,
        }]);
        return;
        }

      const data = await res.json();
      const text = data?.answer || "Sorry, I didn’t catch that.";
      const sources: Source[] | undefined = Array.isArray(data?.sources) ? data.sources : undefined;
      setMsgs(m => [...m, { role: "assistant", content: text, sources }]);
    } catch (e: any) {
      setMsgs(m => [...m, { role: "assistant", content: `Network error: ${e?.message || "please try again"}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="shadow-lg rounded-full px-4 py-3 text-sm font-medium border border-neutral-200"
        style={{ background: BG_BEIGE, color: ACCENT_DARK }}
      >
        {open ? "Close assistant" : "Ask Lumen"}
      </button>

      {open && (
        <div
          id="ai-widget"
          className="mt-3 w-[380px] max-w-[92vw] rounded-2xl border bg-white"
          style={{ borderColor: "#e7e2dc", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
        >
          <div className="p-4 border-b flex items-center gap-3" style={{ background: BG_BEIGE, borderColor: "#eadfd6" }}>
            <div className="h-9 w-9 grid place-items-center rounded-full" style={{ background: ACCENT_DARK }}>
              <CloudBadge />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: ACCENT_DARK }}>Lumen — Diana’s AI Assistant</div>
              <div className="text-xs text-neutral-600">Project-aware • {brand}</div>
            </div>
            <div className="ml-auto">
              <label className="inline-flex items-center gap-2 text-[11px] text-neutral-600">
                <input type="checkbox" checked={showSources} onChange={(e)=>setShowSources(e.target.checked)} />
                Show sources
              </label>
            </div>
          </div>

          {/* Suggestions */}
          <div className="px-3 pt-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendStreaming(s)}
                  className="text-[11px] border rounded-full px-2 py-1"
                  style={{ borderColor: "#e7e2dc", color: ACCENT_DARK }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="p-3 max-h-[320px] overflow-y-auto space-y-2"
               style={{ background: `linear-gradient(180deg, #ffffff, #ffffff 65%, ${BG_BEIGE} 160%)` }}>
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-sm" : "text-sm text-right"}>
                <div
                  className={m.role === "assistant" ? "inline-block rounded-2xl px-3 py-2" : "inline-block rounded-2xl px-3 py-2"}
                  style={m.role === "assistant"
                    ? { background: "#f4f4f5", color: "#1f1f1f" }
                    : { background: ACCENT_DARK, color: "white" }}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && showSources && (m as ChatMsg).sources?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(m as ChatMsg).sources!.map((s, j) => (
                      <a
                        key={j}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] border rounded-full px-2 py-1 hover:underline"
                        style={{ borderColor: "#e7e2dc", color: ACCENT_DARK }}
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {!msgs.length && (
              <div className="text-xs text-neutral-500 p-2">
                Try: “Show me a demo”, “What’s her cloud stack?”, or “Where’s the FinOps CLI?”
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: "#eee7e0" }}>
            <form onSubmit={(e) => { e.preventDefault(); sendStreaming(input); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={busy ? "Thinking…" : "Ask about her projects…"}
                disabled={busy}
                className="flex-1 text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                style={{ borderColor: "#e8e2dc" }}
              />
              <button disabled={busy} className="text-sm rounded-xl px-3 py-2" style={{ background: ACCENT_DARK, color: "white" }}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


