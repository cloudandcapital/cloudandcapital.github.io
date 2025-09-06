// app/api/assistant/route.ts
import OpenAI from "openai";
import { knowledge, type KBEntry } from "@/data/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- utils ----------
function cosineSim(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}
function toks(s: string): string[] {
  return (s.toLowerCase().match(/\b[\p{L}\p{N}\-]+\b/gu) || []).filter(Boolean);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-small";
const GENERATION_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Cache embeddings for knowledge entries (computed on first use)
let kbEmbeddingsPromise: Promise<{ entry: KBEntry; embedding: number[] }[]> | null = null;
async function getKbEmbeddings() {
  if (!kbEmbeddingsPromise) {
    const inputs = knowledge.map(k => `${k.title}\n\n${k.content}`);
    kbEmbeddingsPromise = client.embeddings
      .create({ model: EMBEDDING_MODEL, input: inputs })
      .then(res =>
        res.data.map((d, i) => ({ entry: knowledge[i], embedding: d.embedding as number[] }))
      );
  }
  return kbEmbeddingsPromise;
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const streamMode = searchParams.get("stream") === "1";

    const { question, ownerName = "Diana" } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'question'" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    // ---------- retrieval ----------
    const kbVecs = await getKbEmbeddings();
    const qEmbed = await client.embeddings.create({ model: EMBEDDING_MODEL, input: question });
    const qVec = qEmbed.data[0].embedding as number[];

    // rank by semantic similarity
    const ranked = kbVecs
      .map(({ entry, embedding }) => ({ entry, score: cosineSim(qVec, embedding) }))
      .sort((a, b) => b.score - a.score);

    // build short context for generation
    const context = ranked.slice(0, 5)
      .map(({ entry }, idx) =>
        `### [${idx + 1}] ${entry.title}${entry.url ? `\nURL: ${entry.url}` : ""}\n${entry.content}`
      )
      .join("\n\n");

    // ---------- intent & relevance-filtered sources (pills) ----------
    const qTokens = new Set(toks(question));
    const hayOf = (e: KBEntry) => (e.title + " " + e.content).toLowerCase();
    const overlapCount = (e: KBEntry) => {
      const hay = hayOf(e);
      let c = 0;
      for (const t of qTokens) if (hay.includes(t)) c++;
      return c;
    };

    // intents
    const qHasWatchdog = /\b(watchdog|anomaly|alert|alerts?)\b/i.test(question);
    const qHasCLI      = /\b(cli|command[-\s]?line|finops\s*lite)\b/i.test(question);
    const qHasDemo     = /\b(demo|dashboard|show\s+me|guard)\b/i.test(question);

    const candidates = ranked
      .filter(r => r.entry.url && r.entry.id !== "brand") // never show portfolio as a pill
      .map(r => ({ ...r, overlap: overlapCount(r.entry) }));

    let picked: typeof candidates;

    if (qHasWatchdog) {
      // Watchdog/anomaly questions → Watchdog only
      const wd = candidates.filter(c =>
        c.entry.id === "watchdog" || /watchdog|anomaly|alert/i.test(hayOf(c.entry))
      );
      picked = (wd.length ? wd : candidates).slice(0, 1);
    } else if (qHasDemo) {
      // Demo/dashboard/guard → Cloud Cost Guard only
      const guard = candidates.filter(c =>
        c.entry.id === "cloud-cost-guard" || /cloud\s*cost\s*guard/i.test(c.entry.title)
      );
      picked = (guard.length ? guard : candidates).slice(0, 1);
    } else if (qHasCLI) {
      // CLI/FinOps Lite → FinOps Lite only
      const cli = candidates.filter(c =>
        c.entry.id === "finops-lite" || /\b(cli|finops\s*lite)\b/i.test(hayOf(c.entry))
      );
      picked = (cli.length ? cli : candidates).slice(0, 1);
    } else {
      // Generic: prefer keyword overlap; fallback to top semantic matches; max 2
      const some = candidates.filter(c => c.overlap >= 1);
      picked = (some.length ? some : candidates)
        .sort((a, b) => (b.overlap - a.overlap) || (b.score - a.score))
        .slice(0, 2);
    }

    const sources = picked.map(c => ({ title: c.entry.title, url: c.entry.url! }));

    // ---------- instructions ----------
    const instructions = `You are Lumen, Diana's portfolio AI assistant.
Only acknowledge small talk if the user greets you or asks about well-being (e.g., "hi", "hello", "how are you"). Do NOT small-talk for task-oriented queries like "show me a demo".
Answer using the context below when possible. If a question is unrelated to Diana's work, say you only cover her projects.
Do not include markdown links in your text; refer the user to the sources shown below instead.
Keep replies concise. If the user asks for a demo, mention which demo is relevant in plain text (no links) and say "See sources below" for the URL.`;

    const input = `User question: ${question}\n\nRelevant project notes:\n${context}`;

    // ---------- non-streaming JSON (your widget uses this) ----------
    if (!streamMode) {
      const response = await client.responses.create({ model: GENERATION_MODEL, instructions, input });
      const text = (response as any).output_text || "(No answer)";
      return Response.json({
        answer: text.replace(/\[.*?\]\(.*?\)/g, ""), // strip inline markdown links
        sources
      });
    }

    // ---------- streaming SSE (kept for later use) ----------
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`));
        };
        send("sources", sources); // render pills immediately

        const s = await client.responses.stream({ model: GENERATION_MODEL, instructions, input });
        s.on("text.delta", (delta: string) => send("token", delta));
        s.on("text.completed", () => send("done", ""));
        s.on("end", () => controller.close());
        s.on("error", (e: any) => {
          send("error", e?.message || "stream error");
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (err: any) {
    console.error(err);
    const msg = err?.message || (typeof err === "string" ? err : "Server error");
    if (new URL(req.url).searchParams.get("stream") === "1") {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(`event: error\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
