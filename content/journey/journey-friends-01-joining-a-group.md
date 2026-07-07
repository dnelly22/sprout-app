# 🌱 Sprouts · Journey Game Content
## Friends · Scenario 1 — "Joining a Group"

> **Flagship template.** This is the gold-standard build. Every other scenario follows this exact shape. Easy Mode is fully written below; Medium and Hard reuse the structure with higher social stakes.

---

## Scenario header

- **Category:** Friends
- **Scenario #:** 1
- **Title:** Joining a Group
- **Communication skill:** Entering a conversation confidently
- **Why this skill matters (kid-facing):**
  Walking up to kids who are already playing is one of the scariest things at school — your brain whispers *"what if they say no?"* But here's the secret: most kids are happy to include you. They just need you to ask in a friendly way. Learning how to join a group means you'll never have to stand on the edge of the playground wishing you were in the game.

---

## Data schema (app-ready)

```ts
type Area = "friends" | "talking" | "teasing" | "people" | "boundaries" | "bigFeelings";
type Mode = "easy" | "medium" | "hard";
type Stars = 1 | 2 | 4 | 5; // 5 best · 4 good · 2 passive · 1 poor

interface Choice {
  id: string;
  text: string;              // full sentence the child taps — never one word
  stars: Stars;
  xp: number;                // 25 / 15 / 8 / 3
  traits: string[];          // e.g. ["Kindness","Confidence","Listening"]
  coaching: string;          // the "why" shown after choosing
  skillLearned?: string;     // optional named micro-skill
  tip?: string;              // shown on passive choices
  next: string;              // id of the next beat ("repair" for recovery)
}

interface Beat {             // one "conversation"
  id: string;
  setting: string;
  narration: string;
  speaker?: string;
  line: string;              // what the other character says (the prompt)
  choices: Choice[];         // exactly 4 (repair beat may use 3)
  repair?: boolean;
}

interface Scenario {
  id: string; category: Area; index: number;
  title: string; skill: string; whyItMatters: string;
  modes: Record<Mode, { beats: Beat[]; reflection: string }>;
}
```

**Reward rule (from your spec):**
`★★★★★ → +25 XP · Kindness/Confidence/Listening` · `★★★★ → +15 XP · Respect` · `★★ (passive) → +8 XP + a tip` · `★ (poor) → +3 XP + recovery ("You can still fix this…")`. A poor choice never ends the scenario — it routes to a **repair** beat.

---

# EASY MODE

**The cast:** **Maya** (friendly, the one who runs the game) · **Theo** (competitive, a little gatekeep-y) · **Priya** (shy, quiet, really good at the game).
**Setting:** the blacktop at recess. Three kids are playing four-square. You walk up.

---

## 🟢 Conversation 1 — The Walk-Up  `id: e1`

**Setting:** Recess, the four-square court.
**Narration:** The ball smacks the pavement — *pop, pop, pop.* Maya spins and laughs as Theo nearly trips. They look like they're having the best time. You stop at the edge. Your heart does that fast thing. You want in.
**Maya** *(noticing you)*: "Oh — hey."

**Your move:**

**A.** "Hi! That game looks really fun. Can I play the next round with you?" — ★★★★★ · +25 XP · *Confidence, Kindness*
→ *Coaching:* "Perfect. You were friendly, you said something nice about their game, **and** you asked clearly. That combo is almost impossible to say no to. **Skill learned: The Friendly Ask** — a compliment plus a clear question opens almost any door." → `e2`

**B.** "Hey, can I play too?" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Solid! You asked clearly and politely — that works. To make it even warmer next time, you could add why you want to join, like *'that looks fun.'* Little bit of warmth makes people want to say yes." → `e2`

**C.** *(You stand close by, hoping they'll notice you and ask…)* "Um… are you guys playing?" — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "That took some courage — but waiting to be noticed can leave you stuck on the edge for a long time." *Tip: Next time, ask directly: 'Can I play the next round?' Asking is braver than waiting, and it almost always works.* → `e2`

**D.** "You have to let me play. It's not fair if you don't." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Whoa — that came out as a demand, and demands make people defensive even when they *were* going to say yes. **Good news: you can still fix this.** Let's see what happens…" → `repair`

---

## 🟢 Conversation 2 — The Rules Test  `id: e2`

**Narration:** Maya catches the ball and holds it. "Sure! We're finishing this round — you can jump in after." Then Theo crosses his arms.
**Theo** *(competitive)*: "Okay, but you have to actually know the rules. We play *fast.*"

**Your move:**

**A.** "That's fair! Can you teach me the rules so I don't slow your game down?" — ★★★★★ · +25 XP · *Curiosity, Confidence*
→ *Coaching:* "Brilliant. Theo was testing you, and instead of getting defensive you got *curious* — and you made him feel like the expert. People love being asked to teach. You just turned a gatekeeper into a helper. **Skill learned: Turn a Test into a Team-Up.**" → `e3`

**B.** "No problem, I'll figure it out as I go." — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Calm and confident — nice. You could've connected even more by asking Theo to explain (people warm up when you let them help), but this works great." → `e3`

**C.** "Oh… maybe I'll just watch then." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "One little push-back and you backed all the way out — but you're *allowed* to be new at something." *Tip: Try 'I'm new to this — can you show me?' Nobody expects you to be perfect on your first try.* → `e3`

**D.** "I already know how to play, obviously." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Ouch — 'obviously' makes it sound like Theo's dumb for asking, and now he wants you to lose. **You can still turn this around.**" → `repair`

---

## 🟢 Conversation 3 — Noticing the Quiet One  `id: e3`

**Narration:** You're in! The ball comes to you and — *thwack* — you actually get it back over. Maya cheers, "Nice one!" Off to the side, Priya hasn't said a single word the whole time. But you noticed something: every time the ball goes to her, it's *instantly* gone. She's incredible.

**Your move:**

**A.** "Thanks! Hey Priya — you're so fast at this. How'd you get that good?" — ★★★★★ · +25 XP · *Kindness, Listening*
→ *Coaching:* "This is the move that turns a game into a friendship. You included the quiet kid, gave her a real compliment, and asked her a question so she could talk. Shy kids almost never get invited in like that — Priya will remember you. **Skill learned: Open the Circle.**" → `e4`

**B.** "Thanks! This is really fun, I'm glad I asked to play." — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Warm and positive — great energy. The all-star move would've been to pull quiet Priya in too, but you're building good vibes." → `e4`

**C.** "I'm probably not that good though." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "You got it over the net — that *is* good! Putting yourself down can make others feel awkward about cheering for you." *Tip: Try just 'Thanks!' Accepting a compliment is a confidence skill all on its own.* → `e4`

**D.** "Yeah, I'm way better than I thought. Watch THIS." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Showing off after one good hit can make the group pull back. **No harm done yet — let's keep going and recover.**" → `repair`

---

## 🟢 Conversation 4 — Getting Out  `id: e4`

**Narration:** Next round. You go for a big hit, miss, and the ball bounces away. You're out. Theo grins. "Ha! Out already!" Everyone's looking at you. This is the moment your feelings get loud.
**Theo:** "Out already!"

**Your move:**

**A.** "Good shot, Theo! That one got me. Can I get back in next round?" — ★★★★★ · +25 XP · *Confidence, Emotional Regulation*
→ *Coaching:* "That's how champions lose. You stayed calm, you gave Theo credit, and you asked to keep playing instead of quitting. Handling 'out' without melting down makes kids *want* you in the game. **Skill learned: Lose the Round, Keep the Friend.**" → `e5`

**B.** "Aw man! Okay — good game, that was fun." — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Nicely handled — no pouting, good sportsmanship. You could've asked to jump back in to keep the momentum, but this keeps everyone comfortable." → `e5`

**C.** "I knew I'd mess it up." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "Everybody gets out — it's literally how the game works, it's not a sign about *you.*" *Tip: Try 'I'll get it next time!' Bouncing back beats beating yourself up.* → `e5`

**D.** "That's not fair! You totally distracted me!" — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Blaming Theo when you got out turns a fun game tense fast. **But it's not too late to fix it.**" → `repair`

---

## 🟢 Conversation 5 — The Invite  `id: e5`

**Narration:** The bell rings — recess is over. Everyone groans. As you all head back, Maya jogs up beside you.
**Maya:** "Hey — you should play with us tomorrow!"

**Your move:**

**A.** "I'd love that! Thanks for letting me jump in today, Maya — see you tomorrow!" — ★★★★★ · +25 XP · *Kindness, Confidence*
→ *Coaching:* "The perfect ending. You said yes warmly, you thanked her, and you used her *name* — using someone's name makes them feel like a real friend, not just a kid you played with once. You walked up a stranger and you're leaving a friend. **Skill learned: End Warm, Come Back.**" → `reflection`

**B.** "Okay, sounds good — see you then!" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Friendly and clear — a good yes! A little extra warmth (a thank-you, her name) would make it even stronger, but this is a great place to leave things." → `reflection`

**C.** "Maybe… if you guys actually want me to." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "She just told you she wants you there — you can believe her!" *Tip: When someone invites you, a happy 'Yes, I'd love to!' is all you need. They asked because they meant it.* → `reflection`

**D.** *(shrug)* "Whatever, we'll see." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "A shrug can make a kind invite feel rejected, even if you didn't mean it that way. **Let's look at how that lands and how to do it differently.**" → `repair`

---

## 🔧 Repair Opportunity  `id: repair`  *(reached after any poor choice)*

**Narration:** Things just got a little tense. Maya tilts her head and looks at you — not mad, just… waiting. She's giving you a chance.
**Maya:** "Hey… you don't have to be like that. We were gonna let you play."

**Your move:**

**A.** "You're right — I'm sorry. I think I got nervous and it came out wrong. Can I start over?" — ★★★★★ · +20 XP · *Repair, Confidence*
→ *Coaching:* "THIS is the bravest skill in the whole app. You owned it, you explained the *feeling* behind it (nervous — totally normal!), and you asked to try again. Almost everyone forgives a real apology. **Skill learned: The Repair** — fixing a mistake makes people trust you *more,* not less." → `e2` *(kids forgive — the game continues)*

**B.** "Sorry, I guess." — ★★★☆☆ · +10 XP · *partial repair*
→ *Coaching:* "That's a start — but 'I guess' makes it sound like you don't really mean it. A real 'I'm sorry, that came out wrong' lands so much better. Want to see? Try the full version next time." → `e2` *(kids give you another shot)*

**D.** "Whatever. This game is dumb anyway." — ☆☆☆☆☆ · +3 XP · *refuses repair*
→ *Coaching:* "When we're embarrassed, sometimes we push people away to protect ourselves — but it usually costs us the friendship. The kids head off to line up. **The good news: tomorrow is a brand-new chance, and now you know exactly what to try.**" → `reflection`

---

## 🌟 Final Reflection  `id: reflection`

**Sprout appears.**

> "You did something a LOT of kids are scared to do — you walked right up and asked to join. 🌱
>
> Remember the magic recipe: **say something friendly + ask clearly.** 'That looks fun — can I play?' works almost every single time.
>
> And if it ever comes out wrong? You can always say **'Sorry, that came out wrong — can I try again?'** Fixing a mistake is a superpower, not a weakness.
>
> You're braver than you were five minutes ago. I'm proud of you."

**Save this line:** 💬 *"That looks fun — can I play the next round?"*

**Run summary (auto-filled by the app):** total XP earned · traits grown (Confidence / Kindness / Listening / Respect / Repair) · "Joining a Group" skill +1.

---

# MEDIUM MODE — "The Group That's Mid-Conversation"

**Why it's harder:** There's no game to join — just three kids cracking up about an inside joke you don't get. No obvious "in," and one kid isn't sure they want a fourth.
**The cast:** **Jordan** (funny, telling the story) · **Bree** (bossy, guards the group) · **Kai** (friendly, makes room).
**Setting:** the lunch table. You walk up with your tray.

## 🟡 Conversation 1 — Walking Into a Laugh  `id: m1`

**Narration:** They're *howling.* "—and then it just EXPLODED—" Jordan can barely breathe. You have zero idea what happened. There's no ball to ask about, no game to join. Just a wall of laughter and you, holding a tray.

**Your move:**

**A.** "Okay, I HAVE to know — what's so funny? You guys are dying over here." — ★★★★★ · +25 XP · *Curiosity, Confidence*
→ *Coaching:* "Perfect read. When there's no game to join, the joke *is* the door. Asking 'what's so funny?' with a smile invites them to share — and people love retelling something that made them laugh. **Skill learned: Ask About the Moment.**" → `m2`

**B.** "Hey, is it cool if I sit here?" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Clear and polite — that works. You could've hooked into their fun by asking about the joke, but asking to sit is a solid, honest move." → `m2`

**C.** *(You stand there holding your tray, waiting for a gap in the laughing…)* — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "Waiting for the 'perfect moment' to jump in usually means it never comes." *Tip: You don't need a gap — a friendly 'what's so funny?' makes your own way in.* → `m2`

**D.** *(You laugh loudly along)* "Hahaha, yeah, that's hilarious!" — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Faking a laugh at a joke you didn't hear almost always gets noticed, and it feels worse than just being honest. **No harm done yet — let's recover.**" → `repair-m`

---

## 🟡 Conversation 2 — "You Had to Be There"  `id: m2`

**Narration:** Bree raises an eyebrow at you.
**Bree:** "It's kind of an inside thing. You had to be there."

**Your move:**

**A.** "Ha, fair — inside jokes are the best. You'll have to catch me up sometime. What even happened, the short version?" — ★★★★★ · +25 XP · *Confidence, Curiosity*
→ *Coaching:* "Masterful. Bree gave you a little wall, and you didn't take it personally *or* push too hard — you stayed warm and curious. That's how you melt a gatekeeper. **Skill learned: Don't Take the Wall Personally.**" → `m3`

**B.** "That's totally cool. Mind if I sit here anyway?" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Gracious — you didn't get hurt by the 'inside thing,' you just kept it friendly. Nicely steady." → `m3`

**C.** "Oh — okay, sorry. Never mind." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "'You had to be there' isn't a no — but you heard it as one and started to leave." *Tip: Try 'No worries — can I still join you?' One soft comment shouldn't end your whole try.* → `m3`

**D.** "Fine. I didn't even want to know anyway." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "When we feel shut out, snapping back protects our feelings for a second but pushes people away. **Let's see how to turn it around.**" → `repair-m`

---

## 🟡 Conversation 3 — Jordan Lets You In  `id: m3`

**Narration:** Jordan decides to share. "Okay okay — Sam SNEEZED, and a marker flew across the room and hit the whiteboard *perfectly,* right in the middle of Mr. Lee's drawing." You actually laugh — that's genuinely great.

**Your move:**

**A.** "No way — that's a hidden talent! Has anyone tried to recreate it?" — ★★★★★ · +25 XP · *Confidence, Listening*
→ *Coaching:* "You didn't just laugh — you *added* to the joke and asked a fun question that keeps it rolling. Now you're not a kid standing there; you're part of the bit. **Skill learned: Build On Their Fun.**" → `m4`

**B.** "Hahaha, okay that's actually amazing." — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Real, warm laughter — exactly right. You could've tossed in a question to keep it going, but you're clearly in the moment now." → `m4`

**C.** "Oh. Heh. Yeah, funny." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "A lukewarm reaction can accidentally deflate the fun they just shared with you." *Tip: If something's funny, let it show! Real laughter is the easiest way to connect.* → `m4`

**D.** "Eh, that's not even that funny." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "They trusted you with something they loved and it got swatted down — that stings a group. **You can still fix this.**" → `repair-m`

---

## 🟡 Conversation 4 — The Belonging Test  `id: m4`

**Narration:** Bree's warming up, but she's still sizing you up.
**Bree:** "So do you even like the same stuff as us? We're all on the soccer team."

**Your move:**

**A.** "I actually don't play soccer — but I'd love to learn. Maybe you could show me at recess?" — ★★★★★ · +25 XP · *Confidence, Curiosity*
→ *Coaching:* "This is gold. You didn't pretend to be something you're not, and you didn't apologize for being different — you turned the difference into an *invitation.* Honesty plus curiosity beats fake-fitting-in every time. **Skill learned: Be Real, Stay Curious.**" → `m5`

**B.** "I don't really play, but I like watching. Who's your favorite team?" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Honest and you flipped it into a question — good instincts. You kept the conversation on *them,* which people like." → `m5`

**C.** "Oh… I don't play soccer. Never mind." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "Being different from the group isn't a reason to back out — different is interesting!" *Tip: Try 'I don't play, but I'd love to learn.' You don't have to match to belong.* → `m5`

**D.** "Honestly? Soccer's kind of boring." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Insulting the thing they all love is a fast way to get un-invited. **Tomorrow's not here yet — let's recover now.**" → `repair-m`

---

## 🟡 Conversation 5 — Room at the Table  `id: m5`

**Narration:** Kai slides his tray over and pats the empty spot.
**Kai:** "There's room right here if you want it."

**Your move:**

**A.** "Thanks, Kai! I'm [name], by the way — what are everyone's names?" — ★★★★★ · +25 XP · *Kindness, Confidence*
→ *Coaching:* "You accepted warmly *and* introduced yourself *and* asked their names — that's how a lunch table turns into actual friends. By tomorrow they'll know you, not just recognize you. **Skill learned: Names Make Friends.**" → `reflection-m`

**B.** "Thanks — I really appreciate it!" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Warm and grateful — a great landing. Swapping names would've sealed it even tighter, but this is a real win." → `reflection-m`

**C.** "Are you sure that's okay with everyone?" — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "He offered the seat — you're allowed to take the yes!" *Tip: A simple 'Thanks!' and sitting down is all you need. Believe people when they include you.* → `reflection-m`

**D.** *(You sit down silently and stare at your tray.)* — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Going totally silent after someone's kind can read as 'I don't want to be here.' **Let's try that again.**" → `repair-m`

---

## 🔧 Repair Opportunity  `id: repair-m`

**Narration:** It got a little awkward. Kai gives you a small, easy smile.
**Kai:** "Hey, it's chill — we're just messing around. Wanna actually jump in?"

**A.** "Yeah — sorry, I think I came in weird. I really do want to hang out. Can we start over?" — ★★★★★ · +20 XP · *Repair, Confidence*
→ *Coaching:* "That's the bravest move there is — owning the awkward moment and trying again. People respect that *more,* not less. **Skill learned: The Reset.**" → `m3`

**B.** "Sorry, my bad." — ★★★☆☆ · +10 XP · *partial repair*
→ *Coaching:* "A start! Adding what you actually meant — 'I do want to hang out' — would make it land much warmer. Try the fuller version next time." → `m3`

**D.** "Forget it, you guys are weird anyway." — ☆☆☆☆☆ · +3 XP · *refuses repair*
→ *Coaching:* "Pushing people away when we're embarrassed protects us for a second but costs us the friends. They go back to their lunch. **Tomorrow's a clean slate — and now you've got the words ready.**" → `reflection-m`

---

## 🌟 Final Reflection  `id: reflection-m`

> "That was a tricky one — no game, no easy door, just a group already laughing. And you found your way in anyway. 🌱
>
> The trick when there's no obvious opening: **ask about what they're already doing.** 'What's so funny?' is a key that opens almost any group. And if someone says 'you had to be there' — that's not a no, it's just a tiny wall. Stay friendly and it comes right down.
>
> You don't have to be the same as everyone to belong. Being *real* is more interesting than fitting in."

**Save this line:** 💬 *"Okay, I have to know — what's so funny?"*

---

# HARD MODE — "The Group That Already Said No"

**Why it's hardest:** You asked to sit with them *yesterday* and they said the seats were saved. Today you want to try again — without seeming desperate, and without being bitter about the sting.
**The cast:** **Dev** (said no yesterday) · **Riley** (cool, a little aloof) · **Quinn** (quiet, secretly the kindest one).
**Setting:** same lunch table, one day later. Two empty seats today.

## 🔴 Conversation 1 — The Second Try  `id: h1`

**Narration:** Yesterday you asked to sit here and Dev said the seats were saved. Your face still gets a little hot remembering it. But today there are two empty spots, and your feet carry you over before your brain can talk you out of it. *That* is courage.
**Dev** *(glancing up)*: "…Oh. Hey."

**Your move:**

**A.** "Hey! Are these open today? Totally fine if they're saved again — I just figured I'd ask." — ★★★★★ · +25 XP · *Confidence, Emotional Regulation*
→ *Coaching:* "Incredible. You tried again after a no — most people won't — and you gave them an *easy way out* so there's no pressure. No bitterness about yesterday, just a calm, brave ask. **Skill learned: Try Again, Leave the Door Open.**" → `h2`

**B.** "Hi — can I sit here today?" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Brave and clear — coming back after a no takes real guts, and you did it cleanly." → `h2`

**C.** *(You almost ask… then lose your nerve.)* "Never mind, it's probably saved…" — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "You got *so* close. One bad day doesn't mean today's a no." *Tip: Try 'Are these open today?' Letting fear answer for them means you never find out.* → `h2`

**D.** "Let me guess — these are 'saved' too, right?" — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Sarcasm about yesterday makes them defensive before you even sit down. The hurt's understandable — but it works against you here. **You can still fix it.**" → `repair-h`

---

## 🔴 Conversation 2 — The Cool Reception  `id: h2`

**Narration:** Riley shrugs without much warmth.
**Riley:** "I mean… I guess. We don't really know you, though."

**Your move:**

**A.** "Fair enough — that's actually why I came over. Figured we could fix the 'don't know each other' part. I'm [name]." — ★★★★★ · +25 XP · *Confidence*
→ *Coaching:* "Wow. You took the chilly comment and flipped it into the whole *reason* to be there, then introduced yourself. That's the confidence of someone who knows they're worth knowing. **Skill learned: Turn 'We Don't Know You' Into Hello.**" → `h3`

**B.** "That's okay — everyone's a stranger till they're not, right? I'm [name]." — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Light, warm, and you introduced yourself — that takes the sting out of a cool welcome. Well done." → `h3`

**C.** "Yeah… I guess that's true." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "Agreeing that you're strangers and stopping there leaves you stuck on the outside." *Tip: Add your name! 'True — I'm [name]' starts fixing it right away.* → `h3`

**D.** "Wow. Okay, forget it then." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Giving up angrily at the first cool moment ends it before it started. **Let's rewind and try again.**" → `repair-h`

---

## 🔴 Conversation 3 — Quinn Throws a Lifeline  `id: h3`

**Narration:** Quinn, who's been quiet this whole time, suddenly points at the pin on your backpack.
**Quinn:** "Wait — is that a *Dragon Realm* pin?"

**Your move:**

**A.** "Yes! You play too?? I just hit the part with the ice caves — wait, don't spoil it. Where are you?" — ★★★★★ · +25 XP · *Kindness, Listening*
→ *Coaching:* "You grabbed the lifeline with both hands. A shared interest is the fastest bridge between two people — you lit up, you matched Quinn's excitement, and you asked a question back. Quinn just became your first real friend at this table. **Skill learned: Grab the Common Ground.**" → `h4`

**B.** "Yeah! Do you like it?" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Good — you welcomed the connection and asked back. A little more excitement would've pulled Quinn in even harder, but this works." → `h4`

**C.** "Oh. Yeah, it's whatever." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "Quinn just handed you the perfect way in, and you waved it off!" *Tip: When someone shares something you both like — show it! That overlap is pure gold.* → `h4`

**D.** "Why? Is that a problem?" — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "After yesterday it's easy to read kindness as an attack — but Quinn was being *friendly,* and that snapped at them. **Let's recover.**" → `repair-h`

---

## 🔴 Conversation 4 — The Old Wound  `id: h4`

**Narration:** Dev shifts a little, looking kind of guilty.
**Dev:** "Hey — sorry about yesterday, by the way. The seats actually *were* saved."

**Your move:**

**A.** "Thanks for saying that — it honestly means a lot. I figured it might've been something like that. We're good." — ★★★★★ · +25 XP · *Repair, Emotional Regulation*
→ *Coaching:* "This is so mature it's almost magic. Dev apologized, and instead of making him squirm, you accepted it warmly and let yesterday go. Forgiving someone gracefully is one of the strongest things a person can do. **Skill learned: Accept the Apology, Drop the Grudge.**" → `h5`

**B.** "Oh — it's okay, no big deal." — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Gracious and easy — you let it go without drama. That keeps the table relaxed." → `h5`

**C.** "It kind of did hurt, but… whatever." — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "Half-forgiving leaves the moment awkward and hangs the hurt in the air." *Tip: Try 'Thanks — we're good.' A clean forgiveness frees both of you.* → `h5`

**D.** "Yeah, that actually really wasn't cool of you." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "Punishing someone for apologizing teaches them not to bother next time. **You can still turn this into a good moment.**" → `repair-h`

---

## 🔴 Conversation 5 — Earned It  `id: h5`

**Narration:** Riley looks at you — actually looks — and a real smile finally breaks through.
**Riley:** "Okay. You're alright. You should sit with us."

**Your move:**

**A.** "Thanks — that actually means a lot. Same time tomorrow?" — ★★★★★ · +25 XP · *Confidence, Kindness*
→ *Coaching:* "The perfect close. You were honest that it mattered to you — without being needy — and you locked in *tomorrow,* turning one lunch into a standing invitation. You came back after a no and built something real. That's huge. **Skill learned: Turn Today Into Tomorrow.**" → `reflection-h`

**B.** "Cool — thanks, Riley!" — ★★★★☆ · +15 XP · *Respect*
→ *Coaching:* "Warm and easy, using her name — a great landing on a hard climb." → `reflection-h`

**C.** "Really? Are you sure?" — ★★☆☆☆ · +8 XP · *passive*
→ *Coaching:* "You earned this — you're allowed to just enjoy the win!" *Tip: 'Thanks, I'd like that' lets you accept the good thing you worked for.* → `reflection-h`

**D.** "Took you guys long enough." — ☆☆☆☆☆ · +3 XP · *poor*
→ *Coaching:* "One little jab can undo the whole climb right at the finish line. **Let's land it better.**" → `repair-h`

---

## 🔧 Repair Opportunity  `id: repair-h`

**Narration:** Quinn catches your eye — the quiet one who gets it.
**Quinn:** "Hey… don't give up, it's okay. Try that again?"

**A.** "You're right — sorry. Coming back after yesterday made me nervous and it came out wrong. Can I try again?" — ★★★★★ · +20 XP · *Repair, Confidence*
→ *Coaching:* "Brave *and* honest. You named the real reason — being nervous after a rejection, which anyone would feel — and asked to reset. That kind of honesty is exactly what makes people root for you. **Skill learned: The Honest Reset.**" → `h3`

**B.** "Sorry, that came out wrong." — ★★★☆☆ · +10 XP · *partial repair*
→ *Coaching:* "Good — owning it is the key part. Saying a little about *why* (nervous, hurt from yesterday) helps them understand you. You're on the right track." → `h3`

**D.** "Forget it. I knew this was a bad idea." — ☆☆☆☆☆ · +3 XP · *refuses repair*
→ *Coaching:* "When something's hard, our brain says 'quit before it hurts more.' But you came so far today. They head out — and the truth is, you were *this* close. **Tomorrow you get to try again, and now you know you can.**" → `reflection-h`

---

## 🌟 Final Reflection  `id: reflection-h`

> "Let's be honest — that was the hard one. You walked up to a group that already told you no once. Do you know how brave that is? Most grown-ups won't even do that. 🌱
>
> Two things to keep forever: when you try again after a no, **give people an easy way to say yes** — 'no worries if not, just figured I'd ask.' And when someone says sorry, **let it go cleanly.** Forgiving feels better than staying mad, every time.
>
> You didn't let one 'no' decide who your friends get to be. That's the whole game."

**Save this line:** 💬 *"No worries if they're saved — I just figured I'd ask."*

---
*Friends #1 complete (Easy · Medium · Hard). Next: Friends #2 — Making a New Friend.*
