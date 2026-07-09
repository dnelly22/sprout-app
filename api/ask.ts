/*
 * Ask Sprout — the in-app lesson recommender. Vercel serverless function.
 *
 * Sprout is NOT a free-form parenting coach. It uses Claude only to UNDERSTAND
 * what the parent is describing, then points them to the most relevant lesson(s)
 * ALREADY in the app's library. It never invents advice, scripts, steps, or a
 * diagnosis — the lessons contain the guidance. (Matches the header: "Parenting
 * help · recommends lessons, never diagnoses".)
 *
 * The client sends a compact catalog of its lessons; the model may only return
 * ids from that catalog (validated server-side). The API key stays server-side.
 *
 * Secret lives in a Vercel env var (never in the repo):
 *   ANTHROPIC_API_KEY   your Anthropic API key (SECRET)
 *
 * If the key isn't configured, this returns a graceful fallback with
 * `configured: false` so the chat degrades instead of breaking.
 *
 * NOTE (abuse/cost): this endpoint is unauthenticated and calls a paid API.
 * Inputs are capped (turn count + length + catalog size). Before scaling ad
 * spend, add rate limiting or gate it behind real auth.
 */
import Anthropic from '@anthropic-ai/sdk';

interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  end: () => void;
}

interface InMsg { role?: string; content?: string }
interface InCat { id?: string; title?: string; tag?: string; about?: string }

const MODEL = 'claude-opus-4-8';
const MAX_TURNS = 12;
const MAX_CHARS = 1500;
const MAX_TOKENS = 500;
const MAX_CATALOG = 90;

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reply: { type: 'string' },
    lessons: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply', 'lessons'],
} as const;

function systemPrompt(
  library: string,
  parentName?: string,
  childName?: string,
): string {
  const kid = childName || 'their child';
  const who = parentName ? `You're chatting with ${parentName}` : "You're chatting with a parent";
  return [
    `You are Sprout, the friendly guide inside the Sprout parenting app. ${who}${childName ? `, about ${childName}` : ''}.`,
    ``,
    `You are NOT a parenting coach. You do NOT give advice, tips, scripts, steps, or opinions of your own, and you NEVER diagnose or label a child. The app's LESSONS contain the real guidance. Your only job: understand what the parent is dealing with, then point them to the lesson(s) from the library below that fit best.`,
    ``,
    `Respond as JSON with two fields:`,
    `- "reply": a warm, short message (1–2 sentences) showing you understood their situation, then handing off to the lesson. Reflect the feeling; do NOT solve it yourself. Good: "Screen-time standoffs are exhausting — this lesson gives you the words for it." / "That sounds like a rough bedtime with ${kid}. Here's one that walks through it." Bad: giving your own steps or advice.`,
    `- "lessons": an array of 1–2 lesson ids from the library that best match, best first.`,
    ``,
    `Rules:`,
    `- Use lesson ids EXACTLY as they appear in the library. Never invent an id.`,
    `- If nothing in the library genuinely fits, return "lessons": [] and say you don't have a lesson for that exact thing yet, but they can browse the library. Do NOT force an unrelated recommendation.`,
    `- Never write your own advice, scripts, steps, or a diagnosis in "reply" — only the reflection + handoff. The lesson does the teaching.`,
    `- If the parent describes something dangerous or a crisis (self-harm, someone getting hurt, abuse, a child in danger), set "lessons": [] and gently tell them this is bigger than the app and to reach out right now to someone who can help in person or their local emergency number.`,
    ``,
    `LIBRARY (id | "title" | category — what it's about):`,
    library,
  ].join('\n');
}

const FALLBACK =
  "I'm having a little trouble connecting right now — try me again in a moment. In the meantime, you can browse the Lessons library and search for what's on your mind.";

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  let payload: Record<string, unknown> = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>) || {};
  } catch { payload = {}; }

  const rawMessages = Array.isArray(payload.messages) ? (payload.messages as InMsg[]) : [];
  const parentName = typeof payload.parentName === 'string' ? payload.parentName.slice(0, 60) : undefined;
  const childName = typeof payload.childName === 'string' ? payload.childName.slice(0, 60) : undefined;

  const catalog = (Array.isArray(payload.catalog) ? (payload.catalog as InCat[]) : [])
    .filter((c) => c && typeof c.id === 'string' && typeof c.title === 'string')
    .slice(0, MAX_CATALOG)
    .map((c) => ({
      id: String(c.id).slice(0, 60),
      title: String(c.title).slice(0, 120),
      tag: typeof c.tag === 'string' ? c.tag.slice(0, 60) : '',
      about: typeof c.about === 'string' ? c.about.slice(0, 200) : '',
    }));
  const catalogIds = new Set(catalog.map((c) => c.id));

  // Sanitize conversation: coerce roles, cap length, keep the most recent turns.
  const clean = rawMessages
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content.trim().slice(0, MAX_CHARS) : '',
    }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_TURNS) as { role: 'user' | 'assistant'; content: string }[];

  // The API requires the first message to be from the user.
  while (clean.length && clean[0].role === 'assistant') clean.shift();
  if (!clean.length) { res.status(400).json({ error: 'no_messages' }); return; }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(200).json({ reply: FALLBACK, lessons: [], configured: false }); return; }

  const library = catalog
    .map((c) => `- ${c.id} | "${c.title}"${c.tag ? ` | ${c.tag}` : ''}${c.about ? ` — ${c.about}` : ''}`)
    .join('\n');

  try {
    const client = new Anthropic({ apiKey: key });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt(library, parentName, childName),
      messages: clean,
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    });
    const text = resp.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    let reply = FALLBACK;
    let lessons: string[] = [];
    try {
      const parsed = JSON.parse(text) as { reply?: unknown; lessons?: unknown };
      if (typeof parsed.reply === 'string' && parsed.reply.trim()) reply = parsed.reply.trim();
      if (Array.isArray(parsed.lessons)) {
        lessons = parsed.lessons
          .filter((x): x is string => typeof x === 'string' && catalogIds.has(x))
          .slice(0, 2);
      }
    } catch {
      if (text) reply = text;
    }
    res.status(200).json({ reply, lessons, configured: true });
  } catch (e) {
    res.status(200).json({ reply: FALLBACK, lessons: [], configured: true, error: String(e) });
  }
}
