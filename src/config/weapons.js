// ============================================================
// WEAPON REGISTRY
// To add a new weapon:
//   1. Add an entry here with stats, slot, and modelOffset
//   2. Add a model component in components/weapons/ (see existing ones)
//   3. Add a sound function in lib/audio.js and reference it here
//   4. The weapon will auto-appear in HUD weapon slots
// ============================================================

const WEAPONS = {
  pistol: {
    name: 'Pistol',
    damage: 25,
    fireRate: 400,     // ms between shots
    ammo: 12,
    maxAmmo: 12,
    range: 50,
    spread: 0.02,
    slot: 1,           // keyboard shortcut (Digit1)
    type: 'hitscan',   // hitscan or melee
    sound: 'pistol',   // key into audio.js
  },
  smg: {
    name: 'SMG',
    damage: 15,
    fireRate: 100,
    ammo: 30,
    maxAmmo: 30,
    range: 40,
    spread: 0.05,
    slot: 2,
    type: 'hitscan',
    sound: 'smg',
  },
  knife: {
    name: 'Knife',
    damage: 50,
    fireRate: 500,
    ammo: Infinity,
    maxAmmo: Infinity,
    range: 3,
    spread: 0,
    slot: 3,
    type: 'melee',
    sound: 'knife',
  },

  // ---- EXAMPLE: adding a new weapon ----
  // shotgun: {
  //   name: 'Shotgun',
  //   damage: 12,        // per pellet
  //   fireRate: 800,
  //   ammo: 6,
  //   maxAmmo: 6,
  //   range: 20,
  //   spread: 0.1,
  //   slot: 4,
  //   type: 'hitscan',
  //   pellets: 8,        // custom field: number of pellets
  //   sound: 'shotgun',
  // },
};

// Ordered list of weapon keys for HUD display and cycling
const WEAPON_SLOTS = Object.entries(WEAPONS)
  .sort(([, a], [, b]) => a.slot - b.slot)
  .map(([key]) => key);

// Quick lookup: slot number -> weapon key
const SLOT_TO_WEAPON = {};
for (const [key, weapon] of Object.entries(WEAPONS)) {
  SLOT_TO_WEAPON[weapon.slot] = key;
}

export { WEAPONS, WEAPON_SLOTS, SLOT_TO_WEAPON };
