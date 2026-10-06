# Pixel Pet

An 8-bit virtual puppy built with Next.js (App Router), Auth.js (NextAuth v5, Facebook login), PostgreSQL + Drizzle ORM, Zustand, Framer Motion and Tailwind CSS. Mobile-first: the layout is built for a phone held in one hand.

## Setup

1. `npm install`
2. Create a PostgreSQL database (local Docker, Neon, Supabase, ...) and copy its connection string.
3. In [Meta for Developers](https://developers.facebook.com/apps), add **Facebook Login** to your app and put `http://localhost:3000/api/auth/callback/facebook` in **Valid OAuth Redirect URIs** (add your production URL the same way later).
4. `cp .env.local.example .env.local` and fill it in. `npx auth secret` generates `AUTH_SECRET`.
5. `npm run db:migrate` to create the tables.
6. `npm run dev` and open http://localhost:3000.

While the Facebook app is in Development mode, only accounts with a role on the app (admin, developer, tester) can sign in. To go Live, deploy first, then in **App settings → Basic** fill in:

| Field | Value |
| --- | --- |
| App domains | `<your-domain>` |
| Privacy Policy URL | `https://<your-domain>/privacy` |
| Terms of Service URL | `https://<your-domain>/terms` |
| User data deletion → Data deletion instructions URL | `https://<your-domain>/data-deletion` |

Also add `https://<your-domain>/api/auth/callback/facebook` to **Valid OAuth Redirect URIs**. `CONTACT_EMAIL` is shown on those pages; they are prerendered, so redeploy after changing it.

## How auth and data fit together

- `/api/auth/*` is Auth.js. Facebook OAuth runs on the server; users, linked accounts and sessions live in Postgres (database sessions, not JWTs), so signing out revokes the session immediately.
- Every server read/write of user data starts with `verifySession()` in `lib/dal.ts`, which turns the session cookie into a user id.
- The home page loads the pet on the server and hands it to the client. The client saves with `PUT /api/pet` (`keepalive`, so the save on tab close still lands); the server checks the session, validates the payload and ignores any `ownerId` in it.
- The browser never talks to the database. Swapping Postgres for another SQL database means changing the Drizzle dialect and driver in `src/db/`.

`NEXT_PUBLIC_TIME_SCALE` controls game speed: `100` (the default) drains a full stat bar in about 10 minutes, which is useful for testing. Set it to `1` for real time.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run sprites` | Regenerate the pixel SVGs in `public/sprites` from `scripts/generate-sprites.mjs` |
| `npm run icons` | Regenerate the PWA icons from `scripts/generate-icons.mjs` |
| `npm run db:generate` | Write a SQL migration in `drizzle/` after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Folder structure

```
src/
  app/
    layout.tsx            Fonts (Press Start 2P display, Pixelify Sans body), viewport + safe areas
    page.tsx              Server: setup notice, login screen, or loads the pet and renders <GameScreen />
    visit/[uid]/page.tsx  Server: loads someone else's pet for <VisitScreen />
    error.tsx             Error card with retry (e.g. database unreachable)
    actions/auth.ts       Server Actions: sign in with Facebook, sign out
    api/auth/[...nextauth]/ Auth.js route handler
    api/pet/route.ts      PUT: save the signed-in user's pet
    api/friends/route.ts  GET: other players' pets for the friends list
    globals.css           Light/dark design tokens, room scene, keyframes (all off under reduced motion)
  auth.ts                 Auth.js config: Facebook provider, Drizzle adapter, database sessions
  db/
    schema.ts             Drizzle tables: Auth.js (user, account, session, verificationToken) + pet
    index.ts              Postgres connection
  components/
    GameScreen.tsx        Main screen: wires store + loop + UI
    LoginScreen.tsx       "Continue with Facebook"
    ProfileModal.tsx      Pick breed (avatar) / hats / clothes, plus the account section (sign out)
    FriendsModal.tsx      Other players, linking to /visit/[uid]
    VisitScreen.tsx       Read-only view of someone else's room, refreshed every 10s
    OfflineReportModal.tsx "Welcome back" summary after time away
    hud/                  PetHeader (name, LV, stage, EXP), StatBars, ActionBar
    pet/                  PetSprite (layered sprite + partner), PetStage (room, wandering, effects)
    ui/                   PressButton (squash + pixel burst + sound + haptic), SfxProvider, Modal (bottom sheet), Toasts
  hooks/
    useGameLoop.ts        1s tick, 15s autosave, save on tab hide/close
  lib/
    dal.ts                Data Access Layer: verifySession(), required env check
    petRepository.ts      Server-only: load/create/save pets, list other players, validate client payloads
    petApi.ts             Browser-side save (PUT /api/pet)
    game/
      constants.ts        All balance numbers (decay rates, thresholds, cycle lengths)
      engine.ts           Pure game logic: calculateOfflineDecay, applyAction, status
      breeds.ts           Breed catalogue (level-gated)
      items.ts            Wearable catalogue (level-gated)
  store/
    usePetStore.ts        Zustand store: init, tick, actions, debounced save, toasts
  types/
    pet.ts                PetData and related types
drizzle/                  Generated SQL migrations (commit these)
public/sprites/           dog/, partner/, items/, icons/ (generated SVG pixel art)
scripts/                  generate-sprites.mjs, generate-icons.mjs
```

The game logic in `lib/game/engine.ts` doesn't depend on React or the database. The same `calculateOfflineDecay(pet, now)` advances the pet when the app opens (offline time) and on every live tick. Long gaps are simulated in up to 2,000 steps, so threshold effects happen at about the right time: the care bonus stops when a stat drops below 70, EXP starts draining when a stat hits 0, the pup wakes up when its energy is full, and heat starts on schedule.

## Game rules

| Rule | Value (game time) |
| --- | --- |
| Stat decay while awake | Food 6/h, Clean 4/h, Energy 5/h, Joy 5/h |
| Sleeping | Energy +20/h; other stats decay at 25–50% speed; wakes when energy reaches 100 |
| Level up | When EXP reaches `50 + 25·level + 2·level²` |
| No stat at 0 | +`24 / (1 + 0.1·(level − 1))` EXP/h passively (24 at LV 1, ~6 at LV 29) |
| All stats > 70 | +10 EXP/h on top of the passive gain |
| n stats at 0 | No passive gain; −`5% × 2^(n−1)` of the current level's bar per hour (5/10/20/40%). EXP below 0 drops a level |
| All 4 stats at 0 | Status SICK: also −1 level at once, then again every 24h, at most once per 24h |
| Stage floor | The pup never drops below a stage it has reached (Teen: LV 6, Adult: LV 16) |
| Life stages | LV 1–5 Puppy · LV 6–15 Teen · LV 16+ Adult (max LV 30) |
| Actions | Feed, Bathe, Pet, Walk and Sleep from LV 1; Toy from LV 6 |
| Partner | At LV 6 a sweetheart (Mochi) moves in and follows the pup around |
| Heat (estrus) | From LV 6: every 72h, lasts 12h. Joy drains 2× and the pup barks. Walk/Toy calms it for 4h |

All of these numbers are in `src/lib/game/constants.ts`.

## Pet table: `pet` (one row per user)

Defined in `src/db/schema.ts`. Nested values (`stats`, `equippedItems`, `lastActionAt`) are `jsonb`; epoch-ms fields are `bigint`. As JSON:

```jsonc
{
  "ownerId": "user id",            // primary key, references user.id
  "petName": "Woofy",
  "level": 1,
  "exp": 0,
  "stats": { "hunger": 100, "hygiene": 100, "energy": 100, "happiness": 100 },
  "status": "NORMAL",              // NORMAL | ESTRUS | SLEEPING | SICK
  "equippedItems": { "hat": "cap_red_pixel", "clothes": null },
  "lastUpdated": 1710000000000,    // epoch ms
  // added on top of the base schema:
  "createdAt": 1710000000000,
  "breed": "shiba",                // shiba | husky | choco | dalmatian | pug | poodle | golden; also the avatar
  "pubertyAt": null,               // epoch ms when LV 6 was first reached; anchors the heat cycle
  "estrusSoothedUntil": 0,         // epoch ms; set by Walk / Toy
  "lastActionAt": { "feed": 1710000000000 }, // cooldowns that survive reloads
  "lastSickPenaltyAt": null        // epoch ms of the last level lost to sickness
}
```

## Clothing layers

Every sprite (dog poses per breed in `public/sprites/dog/<breed>/`, and wearables) is a transparent 32×32 image on the same grid; all breeds share one silhouette, so every item fits every breed. `PetSprite` stacks them with `position: absolute`, so items line up in every pose. To use your own PNGs, put them in `public/sprites/items/` and point `src` in `lib/game/items.ts` at them.
