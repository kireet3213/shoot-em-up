// ============================================================
// AUDIO SYSTEM
// All sounds are synthesized via Web Audio API (no files needed).
//
// To add a sound for a new weapon:
//   1. Create a function like playXxxShot()
//   2. Register it in WEAPON_SOUNDS with the weapon's sound key
//   3. The Player component calls playWeaponSound(key) automatically
// ============================================================

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(duration, volume = 0.3) {
  const c = getCtx();
  const len = c.sampleRate * duration;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * volume * (1 - i / len);
  }
  return buf;
}

// ---- Weapon fire sounds ----

function playPistolShot() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.1);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
  gain.gain.setValueAtTime(0.4, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);

  const src = c.createBufferSource();
  src.buffer = noise(0.08, 0.5);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.5, c.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  src.connect(g2);
  g2.connect(c.destination);
  src.start(c.currentTime);
}

function playSMGShot() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.06);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.06);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.06);

  const src = c.createBufferSource();
  src.buffer = noise(0.04, 0.4);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.4, c.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
  src.connect(g2);
  g2.connect(c.destination);
  src.start(c.currentTime);
}

function playKnifeSwing() {
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = noise(0.15, 0.3);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.15);
  filter.Q.value = 2;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(c.currentTime);
}

function playShotgunBlast() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.2);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.25);
  gain.gain.setValueAtTime(0.5, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.25);

  const src = c.createBufferSource();
  src.buffer = noise(0.15, 0.7);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.6, c.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  src.connect(g2);
  g2.connect(c.destination);
  src.start(c.currentTime);
}

// ---- Weapon sound registry ----
// Map weapon sound key -> fire function
const WEAPON_SOUNDS = {
  pistol: playPistolShot,
  smg: playSMGShot,
  shotgun: playShotgunBlast,
  knife: playKnifeSwing,
};

export function playWeaponSound(soundKey) {
  const fn = WEAPON_SOUNDS[soundKey];
  if (fn) fn();
}

// ---- Game event sounds ----

export function playHit() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.1);
}

export function playDamage() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.2);
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.2);
}

export function playKill() {
  const c = getCtx();
  [0, 0.08, 0.16].forEach((t, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600 + i * 200;
    gain.gain.setValueAtTime(0.15, c.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.15);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + t);
    osc.stop(c.currentTime + t + 0.15);
  });
}

export function playRespawn() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, c.currentTime);
  osc.frequency.linearRampToValueAtTime(600, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.3);
}

export function playEmpty() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 500;
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.05);
}

export function playReload() {
  const c = getCtx();
  [0, 0.15].forEach((t) => {
    const src = c.createBufferSource();
    src.buffer = noise(0.05, 0.4);
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000 + t * 3000;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, c.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.05);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(c.currentTime + t);
  });
}
