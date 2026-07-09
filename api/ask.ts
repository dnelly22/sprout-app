/*
 * Ask Sprout — the in-app AI parenting coach. Vercel serverless function.
 *
 * The browser posts the conversation here; this function calls Claude with the
 * Sprout persona + guardrails and returns a single reply. The API key stays on
 * the server (never shipped to the client).
 *
 * Secret lives in a Vercel env var (never in the repo):
 *   ANTHROPIC_API_KEY   your Anthropic API key (SECRET)
 *
 * If the key isn't configured, this returns a graceful fallback with
 * `configured: false` so the chat degrades instead of breaking.
 *
 * NOTE (abuse/cost): this endpoint is unauthenticated and calls a paid API.
 * Inputs are capped (turn count + length) as a basic guard, but before scaling
 * ad spend, add rate limiting (e.g. Vercel's, or a per-IP limiter) or gate it
 * behind real auth. Each message costs a small amount of Claude usage.
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

const MODEL = 'claude-opus-4-8';
const MAX_TURNS = 12;
const MAX_CHARS = 1500;
const MAX_TOKENS = 400;

function systemPrompt(parentName?: string, childName?: string, childAge?: number): string {
  const kid = childName || 'their child';
  const who = parentName ? `You're talking with ${parentName}` : "You're talking with a parent";
  const age = typeof childAge === 'number' && childAge > 0 ? `, whose child ${childName || ''} is about ${childAge}` : '';
  return [
    `You are Sprout — a warm, practical, in-the-moment coach inside the Sprout parenting app. ${who}${age}.`,
    `Your job: help parents with WHAT TO SAY and HOW TO SAY IT to connect with and guide their kids. You are grounded in the Sprout method: connect before you correct, reflect the feeling you see first, then offer one small choice or next step. You help with communication and connection only.`,
    ``,
    `HOW YOU RESPOND:`,
    `- Warm and encouraging, never clinical or preachy. Talk like a calm, wise friend who's been there.`,
    `- Be brief: 2–4 short sentences. This is a text chat in a stressful moment, not an essay.`,
    `- When it helps, offer ONE concrete thing the parent can actually say, in quotes — a short, natural script (use ${kid}'s name where it fits).`,
    `- Meet them where they are. Acknowledge the hard moment before advising.`,
    `- Avoid bullet lists and headers; write like a person texting back.`,
    `- No preamble ("Great question", "I understand you're asking"). Answer directly.`,
    ``,
    `STAY IN SCOPE:`,
    `- You are not a doctor, therapist, or lawyer. Don't diagnose, name conditions, or give medical, legal, or clinical advice. If asked, gently say that's outside what you can help with and suggest the parent talk to their pediatrician or a professional — then offer the communication angle you CAN help with.`,
    ``,
    `SAFETY (important):`,
    `- If the parent describes something serious or dangerous — self-harm, someone getting hurt, abuse, a child in danger, or a crisis — do NOT give coaching tips. Warmly and directly tell them this is bigger than communication coaching and to reach out right now to someone who can help in person: a trusted adult, their child's doctor, or their local emergency number / a crisis line in their area. Keep it short and caring.`,
    ``,
    `Respond directly with your reply to the parent — no notes about your reasoning or process.`,
  ].join('\n');
}

const FALLBACK =
  "I'm having a little trouble connecting right now — try me again in a moment. In the meantime, a move that almost always helps: name what you see and offer one small choice. Something like, “You seem really frustrated. Want to pick what we do next?”";

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  let payload: Record<string, unknown> = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>) || {};
  } catch { payload = {}; }

  const rawMessages = Array.isArray(payload.messages) ? (payload.messages as InMsg[]) : [];
  const parentName = typeof payload.parentName === 'string' ? payload.parentName.slice(0, 60) : undefined;
  const childName = typeof payload.childName === 'string' ? payload.childName.slice(0, 60) : undefined;
  const childAge = typeof payload.childAge === 'number' ? payload.childAge : undefined;

  // Sanitize: coerce roles, cap length, keep the most recent turns.
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
  if (!key) { res.status(200).json({ reply: FALLBACK, configured: false }); return; }

  try {
    const client = new Anthropic({ apiKey: key });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt(parentName, childName, childAge),
      messages: clean,
    });
    const text = resp.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
    res.status(200).json({ reply: text || FALLBACK, configured: true });
  } catch (e) {
    res.status(200).json({ reply: FALLBACK, configured: true, error: String(e) });
  }
}
