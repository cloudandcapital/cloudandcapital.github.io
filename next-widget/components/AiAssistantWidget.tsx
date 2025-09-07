"use client";
import { useRef, useState } from "react";

type Role = "assistant" | "user";
interface Source { title: string; url: string }
interface ChatMsg { role: Role; content: string; sources?: Source[] }

const BG_BEIGE = "#f5eee9";
const ACCENT_DARK = "#111111";

export default function AiAssistantWidget({
  ownerName = "Diana",
  brand = "Cloud & Capital",
  autoOpenDelay = 9999999, // effectively disables auto-open
  logoSrc = "/lumen-icon.png", // icon should be in /public/lumen-icon.png
  onOpen,
  onClose,
}: {
  ownerName?: string;
  brand?: string;
  autoOpenDelay?: number;
  logoSrc?: string;
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    "Show me a quick demo",
    "What’s her cloud stack?",
    "How does she do cost optimization?",
    "Where’s the FinOps CLI?",
  ];

  async function send(q: string) {
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
        try { const e = (await res.json()) as { error?: string }; detail = e?.error || ""; } catch {}
        setMsgs(m => [...m, {
          role: "assistant",
          content: detail ? `I hit a server error: ${detail}` : `I hit a server error (${res.status}). Try again in a moment.`,
        }]);
        return;
      }

      const data = (await res.json()) as { answer?: string; sources?: Source[] };
      const text = data?.answer || "Sorry, I didn’t catch that.";
      const sources = Array.isArray(data?.sources) ? data.sources : undefined;
      setMsgs(m => [...m, { role: "assistant", content: text, sources }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "please try again";
      setMsgs(m => [...m, { role: "assistant", content: `Network error: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          setOpen(o => {
            const next = !o;
            if (next) onOpen?.(); else onClose?.();
            return next;
          });
        }}
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
          {/* Header */}
          <div
            className="p-4 border-b flex items-center gap-3"
            style={{ background: BG_BEIGE, borderColor: "#eadfd6" }}
          >
            <div
              className="h-9 w-9 grid place-items-center rounded-full overflow-hidden"
              style={{ background: "#fff" }}
            >
              <img src={logoSrc} alt="Lumen icon" width={28} height={28} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: ACCENT_DARK }}>
                Lumen ~ {ownerName}’s AI Assistant
              </div>
              <div className="text-xs text-neutral-600 truncate">{brand}</div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="px-3 pt-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-[11px] border rounded-full px-2 py-1"
                  style={{ borderColor: "#e7e2dc", color: ACCENT_DARK }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div
            className="p-3 max-h-[320px] overflow-y-auto space-y-2"
            style={{
              background: `linear-gradient(180deg, #ffffff, #ffffff 65%, ${BG_BEIGE} 160%)`,
            }}
          >
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-sm" : "text-sm text-right"}>
                <div
                  className="inline-block rounded-2xl px-3 py-2"
                  style={
                    m.role === "assistant"
                      ? { background: "#f4f4f5", color: "#1f1f1f" }
                      : { background: ACCENT_DARK, color: "white" }
                  }
                >
                  {m.content}
                </div>

                {m.role === "assistant" && m.sources?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.map((s, j) => (
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={busy ? "Thinking…" : "Ask about her projects…"}
                disabled={busy}
                className="flex-1 text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                style={{ borderColor: "#e8e2dc" }}
              />
              <button
                disabled={busy}
                className="text-sm rounded-xl px-3 py-2"
                style={{ background: ACCENT_DARK, color: "white" }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
