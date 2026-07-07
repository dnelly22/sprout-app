# Sprout by Alenlor

A kids' **communication-skills** app for families. Parents get short lessons and
word-for-word scripts for everyday moments (teasing, big feelings, making friends);
kids get a PIN-gated **Kid Zone** with story-driven games that teach them what to
say. Positioned as a premium **educational** app — not therapy, coaching, or a
diagnostic tool.

- **Live web app:** https://sprout-app-bice.vercel.app
- **Stack:** React 19 + TypeScript + Vite, PWA (vite-plugin-pwa / Workbox), Tone.js for audio, Capacitor for iOS.
- **Storage:** 100% local — all state lives in `localStorage` (`sprout_state_v1`). No backend, no accounts server-side, no data leaves the device.

---

## Quick start

```bash
npm install
npm run dev        # Vite dev server (HMR)
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve the production build locally
npm run lint       # eslint
```

Requires Node 20+ (developed on Node 26).

### iOS (Capacitor — second track, not yet shipped)

```bash
npm run ios:sync    # build + cap sync ios   (needs Xcode + CocoaPods)
npm run ios:open    # open the iOS project in Xcode
```

---

## Architecture

Single-page app. `src/App.tsx` holds the routes; `src/store/AppStore.tsx` is a
`useReducer` + Context store persisted to `localStorage`. Everything derives
from an append-only **activity log** — the app has no server, so all progress,
levels, streaks, and badges are computed from events on the client.

```
src/
  screens/            Parent screens: Today, Lessons, LessonDetail, Progress
                      (“Learning Journey”), Coach (“Ask Sprout”), Settings, Paywall
    onboarding/       Onboarding flow (welcome → add child → trial → quiz → done)
    kidzone/          KidZone shell + Quest/My-Growth tabs, Mascot, confetti
      games/          Journey (story engine), QuickFire, SayIt
  engine/
    economy.ts        ⭐ source of truth: reward table, 10-level ladder, streaks,
                      journey levels, 13 badge defs, daily quest, weekly adventure, boss
    plan.ts           Subscription tiers (free / trial / premium), gating helpers
    selectors.ts      useChildEconomy() — the single lens every screen reads from
    gamification.ts   legacy helper (applyWinBump only)
  data/               Parsed content: journeyScenarios, lessons, quiz, drills…
  components/          Design system (ds/), Focus-Pop primitives (pop.tsx), Tutorial
  audio/              Tone.js music/sfx/voice (lazy-loaded chunk)
  constants/, types/, utils/, styles/

content/journey/      68 authored scenario markdown files (source for the parser)
scripts/              parse-journey.mjs, cutout_anims.py (bg removal), icon gen
public/assets/        art, audio, journey character animations, badge webps
```

### The economy (stars, the only currency)

`recordActivity` runs one pipeline: base stars (per the reward table) + first-of-day
bonus + daily-quest bonus + journey-completion bonus + new-badge bonuses, then writes
`lastAward`, which drives the celebration overlays (level-up, streak, badge/quest
toasts). Levels, streaks, journey progress, badges, and toolkit unlocks are all
**derived** from the activity log — nothing is hand-written into child state.

### Content pipeline

`content/journey/*.md` → `node scripts/parse-journey.mjs` → `src/data/journeyScenarios.ts`
(68 scenarios with beats/choices/repair paths/reflection). Quick Fire and Say It Out
Loud rounds are derived from the same scenarios (`src/data/drills.ts`). The scenario
data is a lazy-loaded chunk so the parent-facing bundle stays lean.

---

## Subscription — Sprouts Premium

One plan, 7-day free trial, annual emphasized (spec in `src/engine/plan.ts`).

- **Pricing:** $14.99/mo · $99/yr (≈$8.25/mo, “Save 45%”, annual default).
- **Free preview:** 1 parent lesson, 1 Journey story, 1 Quick Fire + 1 Say It Out Loud
  sample, 1 child profile, 1 Ask Sprout question. Locked content shows a PREMIUM chip
  and routes to `/plans`.
- **Kid-safety:** any purchase path from Kid Zone shows a **Parent Check** (hold 3s) first.
- **Payments are NOT wired yet.** `STRIPE_MONTHLY` / `STRIPE_ANNUAL` in
  `src/screens/Paywall.tsx` are empty placeholders — the trial toggles local state only.
  Real Stripe Payment Links must be pasted in before charging anyone.

### Codes / hidden modes (dev + launch)

Entered on the `/plans` screen:

- `SPROUT-FAM` → unlock Premium (family & friends)
- `SPROUT-ADMIN` → Premium **+ Admin tools** in Settings (grant stars, switch to the
  free/preview view, replay tutorials, reset app data). Use this to audit every state.

Kid Zone PIN (demo): `1234`.

---

## Status / known gaps

- ✅ Web app feature-complete: onboarding, four dashboards, three kid games, full
  stars/levels/streaks/badges economy, subscription gating, tutorials, PWA.
- ⚠️ **Stripe checkout not connected** (placeholders — see above).
- ⚠️ Data is local-only per device; no cross-device sync or server accounts by design.
- 🚧 iOS/Android (Capacitor) scaffolded but not built/submitted — that's the second
  track, only after the web version validates via ads.
- 🎨 The Boss Challenge currently reuses an existing story on hard mode; a bespoke boss
  story is a future content task.

## Notes for reviewers

- No secrets in the repo — the app is local-only; the only external calls are the
  Google Fonts CSS import and (once configured) Stripe Payment Links.
- `npm run build` is the fastest correctness check (type-check + bundle).
- Start an audit from `src/engine/economy.ts` + `src/engine/plan.ts` (the rules) and
  `src/store/AppStore.tsx` (how they're applied).
