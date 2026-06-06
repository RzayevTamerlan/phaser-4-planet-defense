# Phaser 4 — Planet Defense

A small arcade game built with [Phaser 4](https://github.com/photonstorm/phaser): defend a planet from incoming asteroids by orbiting it with your ship and shooting them down before they hit.

![Gameplay Demo 1](/docs/demo1.gif?raw=true 'Gameplay Demo 1')
![Gameplay Demo 2](/docs/demo2.gif?raw=true 'Gameplay Demo 2')
![Gameplay Demo 3](/docs/demo3.gif?raw=true 'Gameplay Demo 3')

---

## Tech stack

| Tool          | Version | Role                                      |
| ------------- | ------- | ----------------------------------------- |
| Phaser        | 4.1     | Game engine (Canvas renderer, Arcade physics) |
| TypeScript    | 5.7     | Language (strict mode)                    |
| Vite          | 8       | Dev server + production bundler           |
| ESLint        | 10      | Linting (typescript-eslint + prettier)    |
| Prettier      | 3.4     | Code formatting                           |

Resolution: **640 × 450**, FIT scale mode, auto-centered.

---

## Quick start

```sh
yarn install
yarn dev
```

The dev server starts at **http://localhost:5173** and hot-reloads on save.

To build a production bundle:

```sh
yarn build
yarn preview   # serve the built bundle locally
```

---

## Controls

| Key                      | Action                                |
| ------------------------ | ------------------------------------- |
| Arrow Left / Arrow Right | Rotate the ship around the planet     |
| Spacebar                 | Fire the main weapon (200 ms cooldown) |
| Mouse click              | Confirm on title / game-over screens  |

---

## Project structure

```
src/
├── main.ts                       Game config, scene registration, entry point
│
├── common/                       Pure data shared across scenes
│   ├── scene-keys.ts             SCENE_KEYS const map + SceneKey type
│   └── assets.ts                 ASSET_KEYS + manifest of images/audio/spritesheets
│
├── types/                        Shared TypeScript types
│   ├── phaser-body.type.ts       Union of physics body shapes for collision callbacks
│   ├── game-over-scene-data.type.ts
│   └── user-session-data.type.ts
│
├── entities/                     Custom Phaser GameObject subclasses
│   ├── player.ts                 Orbits the planet using polar coordinates
│   ├── bullet.ts                 Fires from the player; self-deactivates off-screen
│   ├── enemy.ts                  Asteroid: random scale + spin; self-deactivates off-screen
│   ├── planet.ts                 Sprite + health; plays the damage-tween on hit
│   └── explosion.ts              One-shot VFX; self-deactivates on animation complete
│
├── systems/                      Game-rule logic (own entities & UI)
│   ├── input-controller.ts       Cursor-key wrapper, exposes intent (rotate, fire)
│   ├── audio-system.ts           Centralized SFX with volume defaults
│   ├── bullet-pool.ts            Group<Bullet> + cooldown-gated fire API
│   ├── explosion-pool.ts         Group<Explosion> + play(x, y) API
│   ├── enemy-spawner.ts          Group<Enemy>, edge-picker spawn, difficulty ramp
│   ├── score-system.ts           Score state + binds to ScoreDisplay
│   └── collision-system.ts       Registers all physics overlaps in one place
│
├── ui/                           HUD components (Container subclasses)
│   ├── score-display.ts          'SCORE: ' label + value text
│   └── health-display.ts         Row of hearts; loseOne() destroys the rightmost
│
└── scenes/                       Composition roots
    ├── preload-scene.ts          Loads all assets, registers animations
    ├── title-scene.ts            Menu screen, max-score readout
    ├── game-scene.ts             Wires entities + systems + UI together (~95 lines)
    └── game-over-scene.ts        Final-score screen, persists max-score
```

---

## Architecture

The project follows a **layered architecture** that keeps each scene small and each class single-purpose. The rule is simple:

> **A layer may only import from layers below it.**

```
┌─────────────────────────────────────────────┐
│  scenes/         (composition root only)    │  ← wires systems together
├─────────────────────────────────────────────┤
│  systems/        (game-rule logic)          │  ← own entities & UI; take Scene in ctor
├─────────────────────────────────────────────┤
│  entities/  +  ui/   (dumb GameObjects)     │  ← extend Phaser classes, no cross-talk
├─────────────────────────────────────────────┤
│  common/  +  types/   (pure data)           │
└─────────────────────────────────────────────┘
```

### What each layer is for

- **`common/`, `types/`** — pure data. Constant maps (`SCENE_KEYS`, `ASSET_KEYS`), interfaces, shared type unions. No runtime behavior.
- **`entities/`** — custom subclasses of `Phaser.GameObjects.Image` / `Phaser.Physics.Arcade.Sprite`. They encapsulate **per-object** state (orbit angle, rotation speed, health). They never know about score, spawn rate, or other entities. Lifetime hooks like `preUpdate()` keep their behavior self-contained — for example, `Bullet` deactivates itself when it leaves the screen instead of relying on the scene's `update()` loop to clean up.
- **`ui/`** — `Phaser.GameObjects.Container` subclasses for HUD widgets. Each takes only the data it needs (a value to display, a max-health count) — never the whole scene or the score system. `ScoreDisplay.setValue(n)` is the entire public surface.
- **`systems/`** — receive the `Phaser.Scene` in their constructor and own a slice of game state (spawning, scoring, audio gating, collisions). They hook into scene events (`time.addEvent`, `physics.add.overlap`) and expose a tiny public API. This is where the actual game rules live.
- **`scenes/`** — the **composition root**. The scene's `create()` reads top-to-bottom as a table of contents for the gameplay loop: instantiate entities, instantiate systems, wire them, register collisions. The body of `GameScene.update()` is ~6 lines.

### Best practices applied here

1. **Single Responsibility per file.** Each class owns one concern. When you need to find "where is the difficulty ramp logic?" you grep for `EnemySpawner` and read 70 lines, not 340.
2. **Entities own their own lifecycle.** Instead of the scene iterating every bullet/enemy in `update()` to clean up off-screen objects, each entity overrides `preUpdate()` and self-deactivates. The scene doesn't even have a per-entity `update` loop.
3. **Pooling lives behind a system.** `BulletPool.fireFrom(player, time)` and `ExplosionPool.play(x, y)` hide all the `getFirstDead` plumbing. Consumers never touch the underlying `Phaser.Physics.Arcade.Group`.
4. **Asset keys are typed constants.** All references to images/audio go through `ASSET_KEYS` from `common/assets.ts` — never raw strings. A typo becomes a TypeScript error at compile time.
5. **Strict TypeScript.** `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all on. Private state uses the modern `#private` syntax for true encapsulation (not the soft `private` keyword).
6. **One physics layer wiring point.** All `physics.add.overlap(...)` calls live in `CollisionSystem`. To add a new collision pair (e.g. bullets vs. asteroids vs. powerups), you edit one file.
7. **Centralized audio.** `AudioSystem.playShot()` / `playHit()` / `playExplosion()` are the only callers of `scene.sound.play(...)`. To add a global mute toggle later, you change one file.
8. **No event bus until you need it.** Cross-scene state flows through `scene.start(key, data)` (already typed via `GameOverSceneData`). The systems within `GameScene` communicate via direct method calls — simpler than pub/sub, sufficient for this scale. Reach for a shared `EventEmitter` only when you have ≥3 systems all reacting to the same trigger.

### Naming conventions

| Construct                | Style                  | Example                          |
| ------------------------ | ---------------------- | -------------------------------- |
| Files                    | `kebab-case.ts`        | `bullet-pool.ts`                 |
| Classes                  | `PascalCase`           | `class EnemySpawner`             |
| Constant maps / enums    | `SCREAMING_SNAKE_CASE` | `ASSET_KEYS.ASTEROID`            |
| Private fields           | `#name`                | `#health`, `#spawnTimer`         |
| Module-level constants   | `SCREAMING_SNAKE_CASE` | `const FIRE_COOLDOWN_MS = 200`   |

---

## Scripts

| Script               | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `yarn dev`           | Start Vite dev server on port 5173 with HMR    |
| `yarn build`         | Type-check with `tsc --noEmit`, then `vite build` to `dist/` |
| `yarn preview`       | Serve the built `dist/` bundle locally         |
| `yarn typecheck`     | TypeScript check only (no emit)                |
| `yarn lint`          | Run ESLint over `src/`                         |
| `yarn lint:fix`      | Run ESLint with auto-fix                       |
| `yarn format`        | Format `src/` with Prettier                    |
| `yarn format:check`  | Check formatting without modifying files       |

---

## Credits

This project would not have been possible without the work of these artists:

| Asset            | Author  | Link                                                                    |
| ---------------- | ------- | ----------------------------------------------------------------------- |
| Player ship      | Foozle  | [Void Main Ship](https://foozlecc.itch.io/void-main-ship)               |
| Backgrounds      | Foozle  | [Void Environment Pack](https://foozlecc.itch.io/void-environment-pack) |
| Enemy ships      | Foozle  | [Void Fleet Pack](https://foozlecc.itch.io/void-fleet-pack-1)           |
| Sound effects    | Ansimuz | [Warped Space Shooter](https://ansimuz.itch.io/warped-space-shooter)    |
| Space background | Piiixl  | [Space Background](https://piiixl.itch.io/space)                        |
| Heart animation  | Mikiz   | [Heart Animation](https://mikiz.itch.io/full-heart-animation)           |