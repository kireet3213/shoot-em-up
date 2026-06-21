# Box Arena FPS - Game Documentation

A first-person shooter built with React, Three.js (via React Three Fiber), and Rapier physics. Play a free-for-all deathmatch against AI bots in a closed box arena.

The codebase is **modular and data-driven** — weapons, levels, bots, and player settings are all defined in config files. Extending the game (new weapons, new maps, harder bots) means editing a config, not rewriting components.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Click **START GAME**, then click the canvas to capture your mouse.

---

## Controls

| Key | Action |
|-----|--------|
| WASD | Move (forward/left/back/right) |
| Mouse | Look around |
| Left Click | Shoot / Attack |
| Space | Jump |
| 1 | Switch to Pistol |
| 2 | Switch to SMG |
| 3 | Switch to Knife |
| R | Reload current weapon |
| Tab (hold) | Show scoreboard |

Weapon slot keys are auto-assigned from the `slot` field in the weapon config. Adding a 4th weapon with `slot: 4` makes it usable via the `4` key automatically.

---

## Game Mechanics

### Match Rules
- **Mode**: Free-For-All (every player for themselves)
- **Duration**: 5 minutes (configurable in `config/bots.js → MATCH_CONFIG.duration`)
- **Players**: You + 5 AI bots (configurable via `MATCH_CONFIG.botCount`)
- **Win condition**: Most kills when timer reaches 0:00

### Weapons

| Weapon | Damage | Fire Rate | Ammo | Range | Spread | Type |
|--------|--------|-----------|------|-------|--------|------|
| Pistol | 25 | 400ms | 12 rounds | 50 units | Low | hitscan |
| SMG | 15 | 100ms | 30 rounds | 40 units | Medium | hitscan |
| Knife | 50 | 500ms | Unlimited | 3 units | None | melee |

- **Pistol**: Balanced all-rounder. Good accuracy, decent damage.
- **SMG**: High fire rate but burns through ammo fast. Best at close-medium range.
- **Knife**: High risk, high reward. Two hits to kill but requires melee range.

All weapon stats are defined in `config/weapons.js`.

### Health & Respawning
- All players have **100 HP** (configurable via `MATCH_CONFIG.playerHealth`)
- When killed, you see a **"YOU DIED"** screen with a **3-second countdown** (`MATCH_CONFIG.respawnTime`)
- After the countdown, you respawn at a random spawn point with full health and full ammo
- Bots also respawn on the same timer

### Spawn Points
Defined per level in `config/levels.js`. The default Box Arena has 9 spawn points: four corners, center, and four mid-edge positions.

---

## Visual & Audio Feedback

### When You Shoot
- **Muzzle flash**: Bright flash + point light at the gun barrel
- **Weapon recoil**: Gun kicks back then recovers
- **Gunshot SFX**: Unique synthesized sound per weapon (keyed via weapon config's `sound` field)
- **Empty click**: Sound when firing with no ammo

### When You Hit an Enemy
- **Hit marker**: Red X flashes on the crosshair
- **Hit sound**: Confirmation tone when a bullet connects
- **Kill sound**: Ascending chime when you eliminate someone

### When You Take Damage
- **Red vignette**: Screen edges flash red
- **Damage direction**: Red arrow indicator pointing toward the attacker
- **Damage sound**: Low rumble when hit

### Kill Feed
Top-right corner shows recent kills: who killed whom. Entries fade after 5 seconds.

### Other Sounds
- **Reload**: Click-clack on pressing R
- **Respawn**: Rising tone when you come back to life
- **Death**: Heavy impact sound on dying

All sounds are synthesized via Web Audio API — no audio files needed.

---

## AI Bot Behavior

Bot difficulty is controlled by **presets** defined in `config/bots.js`.

### Available Presets

| Preset | Speed | Fire Rate | Accuracy | Vision | Damage |
|--------|-------|-----------|----------|--------|--------|
| easy | 3 | 500ms | 0.30 | 20 units | 8 |
| medium | 5 | 300ms | 0.15 | 30 units | 10 |
| hard | 7 | 200ms | 0.08 | 40 units | 15 |

Default preset for all bots: `MATCH_CONFIG.botPreset = 'medium'`

### Wander Mode (no target in range)
- Move at `wanderSpeed × speed` in a random direction
- Change direction every `wanderInterval` seconds (+ random jitter)
- Turn back if approaching arena walls

### Combat Mode (target within vision range)
- **Target selection**: Nearest visible entity (player or other bot — true FFA)
- **Movement**: Approach when far, strafe at `engageDistance`, retreat below `retreatDistance`
- **Accuracy formula**: `hitChance = max(0.2, 1 - distance/visionRange - accuracy)`

---

## Project Structure

```
src/
  App.jsx                 -- Root component, renders Game
  Game.jsx                -- Canvas, physics world, scene composition, level fog

  config/                 -- DATA-DRIVEN CONFIGURATION (edit these to extend the game)
    weapons.js            -- Weapon registry: stats, slots, sound keys, type
    levels.js             -- Level registry: obstacles, spawns, lighting, fog
    bots.js               -- Bot AI presets + match config (duration, bot count, etc.)
    player.js             -- Player tuning: speed, sensitivity, jump force, collider

  store/
    gameStore.js           -- Zustand state management (reads from config, no hardcoded values)

  components/
    Arena.jsx              -- Renders any level from config (floor, walls, obstacles, lights)
    Player.jsx             -- FPS controller: movement, camera, shooting, respawn
    Bot.jsx                -- AI bot: behavior driven by preset config
    Weapon.jsx             -- Weapon model registry + first-person rendering
    HUD.jsx                -- 2D overlay: crosshair, health, ammo, timer, scoreboard,
                              kill feed, damage indicators, menus (reads weapon/match config)

  lib/
    audio.js               -- Sound registry: weapon sounds keyed by name, event sounds
```

### Key Technologies
- **React** — UI framework
- **Three.js** via **@react-three/fiber** — 3D rendering
- **@react-three/drei** — Three.js helpers
- **@react-three/rapier** — Physics engine (gravity, collisions, raycasting)
- **Zustand** — Lightweight state management
- **Vite** — Build tool and dev server

---

## How to Extend

### Adding a New Weapon

1. **Define stats** in `config/weapons.js`:
```js
shotgun: {
  name: 'Shotgun',
  damage: 12,
  fireRate: 800,
  ammo: 6,
  maxAmmo: 6,
  range: 20,
  spread: 0.1,
  slot: 4,           // press 4 to equip
  type: 'hitscan',
  sound: 'shotgun',  // key for audio registry
},
```

2. **Add a 3D model** in `components/Weapon.jsx`:
```js
function ShotgunModel() {
  return (
    <group position={[0.2, -0.3, -0.5]}>
      {/* barrel, stock, etc. */}
      <MuzzleFlash position={[0, 0, -0.4]} />
    </group>
  );
}

// Register it:
const WEAPON_MODELS = {
  ...existing,
  shotgun: ShotgunModel,
};
```

3. **Add a fire sound** in `lib/audio.js`:
```js
function playShotgunBlast() { /* Web Audio synthesis */ }

const WEAPON_SOUNDS = {
  ...existing,
  shotgun: playShotgunBlast,
};
```

That's it — the HUD weapon slots, ammo display, and key binding all work automatically.

### Adding a New Level

Add an entry to `LEVELS` in `config/levels.js`:

```js
warehouse: {
  name: 'Warehouse',
  size: 40,
  wallHeight: 6,
  floorColor: '#4a4a3a',
  wallColor: '#555544',
  fog: { color: '#2a2a1e', near: 25, far: 50 },
  lighting: {
    ambient: 0.3,
    directional: { position: [10, 20, 5], intensity: 0.8 },
    points: [
      { position: [-10, 5, -10], intensity: 0.6, color: '#ffddaa' },
    ],
  },
  spawns: [
    [-15, 1, -15], [15, 1, -15], [-15, 1, 15], [15, 1, 15],
  ],
  obstacles: [
    { position: [0, 1.5, 0], size: [8, 3, 2], color: '#7a6a5a' },
  ],
},
```

Then set `MATCH_CONFIG.defaultLevel = 'warehouse'` in `config/bots.js`, or pass the key to `startGame('warehouse')`.

### Adding a Bot Difficulty

Add a preset to `BOT_PRESETS` in `config/bots.js`:

```js
nightmare: {
  speed: 9,
  fireRate: 150,
  accuracy: 0.03,
  visionRange: 50,
  damage: 20,
  wanderInterval: 1,
  wanderSpeed: 0.7,
  engageDistance: 4,
  retreatDistance: 3,
},
```

Then set `MATCH_CONFIG.botPreset = 'nightmare'`.

### Tuning Player Settings

Edit `config/player.js`:
```js
const PLAYER_CONFIG = {
  moveSpeed: 10,         // faster movement
  mouseSensitivity: 0.003, // higher sensitivity
  jumpForce: 7,          // higher jumps
  height: 0.8,           // camera height
  ...
};
```

### Changing Match Settings

Edit `MATCH_CONFIG` in `config/bots.js`:
```js
const MATCH_CONFIG = {
  duration: 10 * 60,      // 10-minute match
  botCount: 8,            // more bots
  botPreset: 'hard',      // harder AI
  respawnTime: 5,         // longer respawn
  playerHealth: 150,      // more health
  botHealth: 80,          // weaker bots
  defaultWeapon: 'smg',   // start with SMG
  defaultLevel: 'box_arena',
};
```

---

## Architecture Decisions

### Why Config Files Instead of Hardcoded Values?
Every tunable number lives in `config/` so you can change gameplay without touching component logic. Components read from config at runtime — they don't know or care what specific weapons/levels exist.

### Why a Weapon Sound Registry?
The `WEAPON_SOUNDS` map in `audio.js` lets you call `playWeaponSound(weaponDef.sound)` without if/else chains. Adding a weapon with a new `sound` key + a matching function in the registry is all you need.

### Why Bot Presets?
Bot AI has ~10 tunable parameters. Presets bundle these into named difficulties you can assign per-bot or per-match. The `createBot()` factory stamps each bot with a preset key so the Bot component loads the right config at runtime.

### Why Level Configs?
Levels are just data: arrays of obstacle positions/sizes, spawn coordinates, and lighting values. The Arena component loops over these arrays and renders them. No per-level component code needed.

---

## How Core Systems Work

### Shooting (Hitscan)
1. Player clicks → `shoot()` in `Player.jsx`
2. Ray cast from camera position in look direction (+ weapon spread)
3. Rapier physics engine returns first hit surface
4. Hit point checked against all alive bot positions (1.5 unit radius)
5. On hit: damage applied, hit marker shown, sound played
6. On kill: kill feed updated, kill sound played, score incremented

### Game Loop
1. `Player.useFrame()` runs every frame (~60fps)
2. Calls `store.tick(delta)` unconditionally — this handles:
   - Match timer countdown
   - Player respawn timer countdown → teleport on expiry
   - Bot respawn timer countdown → position reset on expiry
3. Player input processed (movement, shooting)
4. Each Bot's `useFrame()` runs AI independently

### State Management
Single Zustand store. No hardcoded values — all initial state derived from configs:
- `gameState` — "menu" | "playing" | "ended"
- `currentLevel` — key into `LEVELS`
- `timeRemaining` — from `MATCH_CONFIG.duration`
- `player` — health from config, weapons cloned from `WEAPONS`
- `bots[]` — created via `createBot()` with preset
