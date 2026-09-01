# QuestDaily

Gamified productivity and habit-building web app. Opening it should feel like
booting a game, not a chore list. Every task is a **Quest**.

## Build rule

Do not generate the whole app at once. Scaffold first, then build **one
vertical slice at a time** (schema → server action → UI → test):

1. Auth + empty dashboard shell
2. Quest CRUD (no gamification)
3. Gamification engine + completion flow
4. Dashboard visualizations
5. Quest Chains + Boss Battles (lead differentiator)
6. Reminders / notifications
7. Cosmetic shop / profile polish
8. AI Coach (post-MVP — stub architecture only)

## Visual language (locked)

Reference: `docs/design/reference.png` (ZenZ-style mock). Match this, do not
ship a generic SaaS dashboard.

- **Mood:** playful, soft, toy-like. Glass + clay 3D, not flat corporate.
- **Canvas:** cool lavender-white (`#EEF1FF`) with faint pastel blobs.
- **Surfaces:** frosted glass — `bg-white/70`, `backdrop-blur-xl`, hairline
  white border, large `rounded-[2rem]`, soft colored shadows.
- **Accents:** lavender `#7C6CF6`, bubblegum `#FF8FB3`, mint `#5EEAD4`,
  sun `#FFD56A`, coral CTA gradient `#FF8A65 → #FF6B9D`.
- **Type:** rounded sans (Nunito). Big friendly headings, short labels.
- **Chrome:** mobile-first phone column; bottom tab bar on app routes
  (Home / Quests / Stats / Profile).
- **Signature widgets:** greeting + mascot, circular progress “Today’s Focus”
  card, 7-dot streak row, pastel category tiles, full-width gradient CTA
  with circular arrow.

## Architecture

- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui as primitives
  restyled to this language
- Prisma + PostgreSQL; Auth.js v5; Zustand (client); TanStack Query (server
  cache); Framer Motion (rewards); Zod (shared validation)
- Mutations via Server Actions only
- Gamification math in `lib/gamification/` — pure functions, no Next/Prisma
- Log every XP / level / streak / achievement event to `Event` for a future
  AI Coach

## Routes

| Path | Purpose |
| --- | --- |
| `app/(marketing)` | Landing |
| `app/(auth)` | Sign in / up |
| `app/(app)/dashboard` | Home |
| `app/(app)/quests` | Quest board |
| `app/(app)/quests/[id]` | Quest detail |
| `app/(app)/profile` | Character + cosmetics |
| `app/(app)/achievements` | Badge gallery |
