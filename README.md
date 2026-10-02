# Pixel Pet

An 8-bit virtual puppy built with Next.js (App Router), Firebase (Anonymous Auth + Firestore), Zustand, Framer Motion and Tailwind CSS. Mobile-first: the layout is built for a phone held in one hand.

## Setup

1. `npm install`
2. Create a Firebase project, then:
   - **Authentication → Sign-in method**: enable **Anonymous**.
   - **Firestore Database**: create a database, then paste [`firestore.rules`](firestore.rules) into the **Rules** tab.
   - **Project settings → Your apps**: add a Web app and copy its config.
3. `cp .env.local.example .env.local` and fill in the config values.
4. `npm run dev` and open http://localhost:3000.

`NEXT_PUBLIC_TIME_SCALE` controls game speed: `100` (the default) drains a full stat bar in about 10 minutes, which is useful for testing. Set it to `1` for real time.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run sprites` | Regenerate the pixel SVGs in `public/sprites` from `scripts/generate-sprites.mjs` |

## Folder structure

```
src/
  app/
    layout.tsx            Fonts (Press Start 2P display, Pixelify Sans body), viewport + safe areas
    page.tsx              Renders <GameScreen />
    globals.css           Light/dark design tokens, room scene, keyframes (all off under reduced motion)
  components/
    GameScreen.tsx        Main screen: wires store + loop + UI
    ProfileModal.tsx      Pick breed (avatar) / hats / clothes
    OfflineReportModal.tsx "Welcome back" summary after time away
    hud/                  PetHeader (name, LV, stage, EXP), StatBars, ActionBar
    pet/                  PetSprite (layered sprite + partner), PetStage (room, wandering, effects)
    ui/                   PressButton (squash + pixel burst + sound + haptic), SfxProvider, Modal (bottom sheet), Toasts
  hooks/
    useGameLoop.ts        1s tick, 15s autosave, save on tab hide/close
  lib/
    firebase.ts           Firebase init from env vars
    petRepository.ts      Anonymous sign-in, load/create/save pets/{uid}
    game/
      constants.ts        All balance numbers (decay rates, thresholds, cycle lengths)
      engine.ts           Pure game logic: calculateOfflineDecay, applyAction, status
      breeds.ts           Breed catalogue (level-gated)
      items.ts            Wearable catalogue (level-gated)
  store/
    usePetStore.ts        Zustand store: init, tick, actions, debounced save, toasts
  types/
    pet.ts                PetData (Firestore schema) and related types
public/sprites/           dog/, partner/, items/, icons/ (generated SVG pixel art)
scripts/                  generate-sprites.mjs
firestore.rules           Security rules: users can only touch their own pet
```

The game logic in `lib/game/engine.ts` doesn't depend on React or Firebase. The same `calculateOfflineDecay(pet, now)` advances the pet when the app opens (offline time) and on every live tick. Long gaps are simulated in up to 2,000 steps, so threshold effects happen at about the right time: the care bonus stops when a stat drops below 70, EXP starts draining when a stat hits 0, the pup wakes up when its energy is full, and heat starts on schedule.

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

## Firestore schema: `pets/{userId}`

```jsonc
{
  "ownerId": "uid",
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
