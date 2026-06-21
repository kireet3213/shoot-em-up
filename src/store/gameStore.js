import { create } from 'zustand';
import { WEAPONS } from '../config/weapons';
import { LEVELS } from '../config/levels';
import { MATCH_CONFIG, createBot } from '../config/bots';

function getLevel(key) {
  return LEVELS[key] || LEVELS[Object.keys(LEVELS)[0]];
}

function getSpawns(levelKey) {
  return getLevel(levelKey).spawns;
}

function randomSpawn(levelKey) {
  const spawns = getSpawns(levelKey);
  return [...spawns[Math.floor(Math.random() * spawns.length)]];
}

function freshWeapons() {
  return JSON.parse(JSON.stringify(WEAPONS));
}

const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'menu',  // menu | playing | ended
  timeRemaining: MATCH_CONFIG.duration,
  currentLevel: MATCH_CONFIG.defaultLevel,

  // Player
  player: {
    health: MATCH_CONFIG.playerHealth,
    maxHealth: MATCH_CONFIG.playerHealth,
    weapon: MATCH_CONFIG.defaultWeapon,
    weapons: { ...WEAPONS },
    kills: 0,
    deaths: 0,
    alive: true,
    respawnTimer: 0,
    needsRespawnTeleport: false,
    position: [0, 1, 0],
  },

  // Bots
  bots: [],

  // UI state
  showScoreboard: false,
  hitMarker: false,
  muzzleFlash: false,
  damageIndicators: [],
  nextDamageId: 0,
  killFeed: [],

  // ---- Actions ----

  startGame: (levelKey) => {
    const level = levelKey || get().currentLevel;
    const bots = [];
    for (let i = 1; i <= MATCH_CONFIG.botCount; i++) {
      const bot = createBot(i);
      bot.position = randomSpawn(level);
      bots.push(bot);
    }
    set({
      gameState: 'playing',
      timeRemaining: MATCH_CONFIG.duration,
      currentLevel: level,
      bots,
      player: {
        health: MATCH_CONFIG.playerHealth,
        maxHealth: MATCH_CONFIG.playerHealth,
        weapon: MATCH_CONFIG.defaultWeapon,
        weapons: freshWeapons(),
        kills: 0,
        deaths: 0,
        alive: true,
        respawnTimer: 0,
        needsRespawnTeleport: false,
        position: randomSpawn(level),
      },
      killFeed: [],
      damageIndicators: [],
    });
  },

  tick: (delta) => {
    const state = get();
    if (state.gameState !== 'playing') return;

    const newTime = state.timeRemaining - delta;
    if (newTime <= 0) {
      set({ timeRemaining: 0, gameState: 'ended' });
      return;
    }

    const level = state.currentLevel;

    // Handle player respawn
    let player = { ...state.player };
    if (!player.alive) {
      player.respawnTimer -= delta;
      if (player.respawnTimer <= 0) {
        player.alive = true;
        player.health = MATCH_CONFIG.playerHealth;
        player.respawnTimer = 0;
        player.position = randomSpawn(level);
        player.weapons = freshWeapons();
        player.needsRespawnTeleport = true;
      }
    }

    // Handle bot respawns
    const bots = state.bots.map(bot => {
      if (!bot.alive) {
        const newTimer = bot.respawnTimer - delta;
        if (newTimer <= 0) {
          return {
            ...bot,
            alive: true,
            health: MATCH_CONFIG.botHealth,
            respawnTimer: 0,
            position: randomSpawn(level),
          };
        }
        return { ...bot, respawnTimer: newTimer };
      }
      return bot;
    });

    set({ timeRemaining: newTime, player, bots });
  },

  switchWeapon: (weapon) => {
    if (!WEAPONS[weapon]) return;
    set(state => ({
      player: { ...state.player, weapon }
    }));
  },

  damageBot: (botId, damage, killerName) => {
    const state = get();
    const killedBot = state.bots.find(b => b.id === botId);
    const willDie = killedBot && killedBot.health - damage <= 0;

    set(state => {
      const bots = state.bots.map(bot => {
        if (bot.id !== botId) return bot;
        const newHealth = bot.health - damage;
        if (newHealth <= 0) {
          return {
            ...bot,
            health: 0,
            alive: false,
            respawnTimer: MATCH_CONFIG.respawnTime,
            deaths: bot.deaths + 1,
          };
        }
        return { ...bot, health: newHealth };
      });

      return {
        bots,
        hitMarker: true,
        player: willDie && !killerName
          ? { ...state.player, kills: state.player.kills + 1 }
          : state.player,
      };
    });

    if (willDie) {
      get().addKillFeedEntry(killerName || 'You', killedBot.name);
    }
    setTimeout(() => set({ hitMarker: false }), 150);
  },

  damagePlayer: (damage, attackerPos) => {
    if (attackerPos) {
      get().addDamageIndicator(attackerPos);
    }
    set(state => {
      const newHealth = state.player.health - damage;
      if (newHealth <= 0) {
        return {
          player: {
            ...state.player,
            health: 0,
            alive: false,
            respawnTimer: MATCH_CONFIG.respawnTime,
            deaths: state.player.deaths + 1,
          }
        };
      }
      return { player: { ...state.player, health: newHealth } };
    });
  },

  addBotKill: (botId) => {
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId ? { ...b, kills: b.kills + 1 } : b
      )
    }));
  },

  setPlayerPosition: (pos) => {
    set(state => ({
      player: { ...state.player, position: pos }
    }));
  },

  updateBotPosition: (botId, position, rotation) => {
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId ? { ...b, position, rotation } : b
      )
    }));
  },

  toggleScoreboard: (show) => set({ showScoreboard: show }),

  consumeAmmo: () => {
    set(state => {
      const weapon = state.player.weapon;
      const wData = WEAPONS[weapon];
      if (!wData || wData.type === 'melee') return state;
      const weapons = { ...state.player.weapons };
      weapons[weapon] = { ...weapons[weapon], ammo: weapons[weapon].ammo - 1 };
      return { player: { ...state.player, weapons } };
    });
  },

  reload: () => {
    set(state => {
      const weapon = state.player.weapon;
      const wData = WEAPONS[weapon];
      if (!wData || wData.type === 'melee') return state;
      const weapons = { ...state.player.weapons };
      weapons[weapon] = { ...weapons[weapon], ammo: weapons[weapon].maxAmmo };
      return { player: { ...state.player, weapons } };
    });
  },

  triggerMuzzleFlash: () => {
    set({ muzzleFlash: true });
    setTimeout(() => set({ muzzleFlash: false }), 50);
  },

  addDamageIndicator: (attackerPos) => {
    set(state => ({
      damageIndicators: [...state.damageIndicators, {
        id: state.nextDamageId,
        attackerPos: [...attackerPos],
        time: Date.now(),
      }],
      nextDamageId: state.nextDamageId + 1,
    }));
    setTimeout(() => {
      set(state => ({
        damageIndicators: state.damageIndicators.filter(d => Date.now() - d.time < 1000),
      }));
    }, 1100);
  },

  addKillFeedEntry: (killer, victim) => {
    set(state => ({
      killFeed: [...state.killFeed.slice(-4), {
        id: Date.now(),
        killer,
        victim,
        time: Date.now(),
      }],
    }));
    setTimeout(() => {
      set(state => ({
        killFeed: state.killFeed.filter(k => Date.now() - k.time < 5000),
      }));
    }, 5100);
  },
}));

export default useGameStore;
