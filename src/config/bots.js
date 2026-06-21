// ============================================================
// BOT AI CONFIGURATION
// To add a new difficulty preset:
//   1. Add an entry to BOT_PRESETS
//   2. Reference it in MATCH_CONFIG.botPreset
//
// To adjust individual bot behavior per-match, override in MATCH_CONFIG
// ============================================================

const BOT_PRESETS = {
  easy: {
    speed: 3,
    fireRate: 500,       // ms between shots
    accuracy: 0.3,       // spread factor (higher = less accurate)
    visionRange: 20,
    damage: 8,
    wanderInterval: 3,   // seconds between direction changes
    wanderSpeed: 0.4,    // multiplier of speed when wandering
    engageDistance: 6,    // preferred fighting range
    retreatDistance: 2,   // back up if closer than this
  },
  medium: {
    speed: 5,
    fireRate: 300,
    accuracy: 0.15,
    visionRange: 30,
    damage: 10,
    wanderInterval: 2,
    wanderSpeed: 0.5,
    engageDistance: 5,
    retreatDistance: 3,
  },
  hard: {
    speed: 7,
    fireRate: 200,
    accuracy: 0.08,
    visionRange: 40,
    damage: 15,
    wanderInterval: 1.5,
    wanderSpeed: 0.6,
    engageDistance: 4,
    retreatDistance: 3,
  },
};

// ============================================================
// MATCH CONFIGURATION
// Change these to adjust the game setup
// ============================================================

const MATCH_CONFIG = {
  duration: 5 * 60,       // match length in seconds
  botCount: 5,            // number of bots
  botPreset: 'medium',    // default AI preset for all bots
  respawnTime: 3,         // seconds to respawn
  playerHealth: 100,
  botHealth: 100,
  defaultWeapon: 'pistol',
  defaultLevel: 'box_arena',
};

function createBot(id, preset = MATCH_CONFIG.botPreset) {
  const config = BOT_PRESETS[preset] || BOT_PRESETS.medium;
  return {
    id,
    name: `Bot ${id}`,
    health: MATCH_CONFIG.botHealth,
    maxHealth: MATCH_CONFIG.botHealth,
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    weapon: 'smg',
    kills: 0,
    deaths: 0,
    alive: true,
    respawnTimer: 0,
    preset,    // store which preset this bot uses
  };
}

function getBotConfig(preset = 'medium') {
  return BOT_PRESETS[preset] || BOT_PRESETS.medium;
}

export { BOT_PRESETS, MATCH_CONFIG, createBot, getBotConfig };
