import useGameStore from '../store/gameStore';
import { WEAPONS, WEAPON_SLOTS } from '../config/weapons';
import { MATCH_CONFIG } from '../config/bots';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function DamageIndicator({ indicator, playerPos }) {
  const age = (Date.now() - indicator.time) / 1000;
  if (age > 1) return null;
  const opacity = Math.max(0, 1 - age);
  const ap = indicator.attackerPos;
  const angle = Math.atan2(ap[0] - playerPos[0], -(ap[2] - playerPos[2]));

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      width: '100px', height: '100px',
      transform: `translate(-50%, -50%) rotate(${angle}rad)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', top: '-60px', left: '50%',
        transform: 'translateX(-50%)',
        width: '8px', height: '40px',
        background: `linear-gradient(to bottom, rgba(255, 0, 0, ${opacity}), transparent)`,
        borderRadius: '4px',
      }} />
    </div>
  );
}

function DamageVignette() {
  const indicators = useGameStore(s => s.damageIndicators);
  const hasRecent = indicators.some(d => Date.now() - d.time < 500);
  if (!hasRecent) return null;
  const oldest = Math.min(...indicators.map(d => Date.now() - d.time));
  const intensity = Math.max(0, 1 - oldest / 500);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 90,
      boxShadow: `inset 0 0 ${80 * intensity}px ${20 * intensity}px rgba(255, 0, 0, ${0.3 * intensity})`,
    }} />
  );
}

function KillFeed() {
  const killFeed = useGameStore(s => s.killFeed);
  if (killFeed.length === 0) return null;

  return (
    <div style={styles.killFeed}>
      {killFeed.map(entry => {
        const opacity = Math.max(0, 1 - (Date.now() - entry.time) / 5000);
        return (
          <div key={entry.id} style={{ ...styles.killFeedEntry, opacity }}>
            <span style={{ color: entry.killer === 'You' ? '#44ff44' : '#ff6644' }}>{entry.killer}</span>
            <span style={{ color: '#888', margin: '0 6px' }}> killed </span>
            <span style={{ color: entry.victim === 'You' ? '#44ff44' : '#ff6644' }}>{entry.victim}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function HUD() {
  const player = useGameStore(s => s.player);
  const timeRemaining = useGameStore(s => s.timeRemaining);
  const gameState = useGameStore(s => s.gameState);
  const showScoreboard = useGameStore(s => s.showScoreboard);
  const bots = useGameStore(s => s.bots);
  const hitMarker = useGameStore(s => s.hitMarker);
  const startGame = useGameStore(s => s.startGame);
  const damageIndicators = useGameStore(s => s.damageIndicators);

  if (gameState === 'menu') {
    const weaponList = WEAPON_SLOTS.map(k => `${WEAPONS[k].slot} - ${WEAPONS[k].name}`).join(' | ');
    return (
      <div style={styles.overlay}>
        <div style={styles.menu}>
          <h1 style={styles.title}>BOX ARENA FPS</h1>
          <p style={styles.subtitle}>Free-For-All Deathmatch</p>
          <p style={styles.info}>You vs {MATCH_CONFIG.botCount} Bots | {Math.floor(MATCH_CONFIG.duration / 60)} Minutes</p>
          <button style={styles.button} onClick={() => startGame()}>START GAME</button>
          <div style={styles.controls}>
            <h3>Controls</h3>
            <p>WASD - Move | Mouse - Look | Click - Shoot</p>
            <p>{weaponList}</p>
            <p>R - Reload | Space - Jump | Tab - Scoreboard</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    const allPlayers = [
      { name: 'You', kills: player.kills, deaths: player.deaths },
      ...bots.map(b => ({ name: b.name, kills: b.kills, deaths: b.deaths })),
    ].sort((a, b) => b.kills - a.kills);

    return (
      <div style={styles.overlay}>
        <div style={styles.menu}>
          <h1 style={styles.title}>MATCH OVER</h1>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Kills</th>
                <th style={styles.th}>Deaths</th>
                <th style={styles.th}>K/D</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map((p, i) => (
                <tr key={p.name} style={p.name === 'You' ? styles.highlight : {}}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.kills}</td>
                  <td style={styles.td}>{p.deaths}</td>
                  <td style={styles.td}>{p.deaths ? (p.kills / p.deaths).toFixed(1) : p.kills.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={styles.button} onClick={() => startGame()}>PLAY AGAIN</button>
        </div>
      </div>
    );
  }

  const weaponData = player.weapons[player.weapon];
  const weaponDef = WEAPONS[player.weapon];

  return (
    <>
      <DamageVignette />

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 95 }}>
        {damageIndicators.map(ind => (
          <DamageIndicator key={ind.id} indicator={ind} playerPos={player.position} />
        ))}
      </div>

      {/* Crosshair */}
      <div style={styles.crosshair}>
        <div style={{ ...styles.crosshairLine, width: '2px', height: '16px', top: '-10px', left: '-1px' }} />
        <div style={{ ...styles.crosshairLine, width: '2px', height: '16px', bottom: '-10px', left: '-1px' }} />
        <div style={{ ...styles.crosshairLine, width: '16px', height: '2px', left: '-10px', top: '-1px' }} />
        <div style={{ ...styles.crosshairLine, width: '16px', height: '2px', right: '-10px', top: '-1px' }} />
        {hitMarker && (
          <>
            <div style={{ ...styles.hitLine, transform: 'rotate(45deg)', top: '-8px', left: '-8px' }} />
            <div style={{ ...styles.hitLine, transform: 'rotate(-45deg)', top: '-8px', right: '-8px' }} />
            <div style={{ ...styles.hitLine, transform: 'rotate(-45deg)', bottom: '-8px', left: '-8px' }} />
            <div style={{ ...styles.hitLine, transform: 'rotate(45deg)', bottom: '-8px', right: '-8px' }} />
          </>
        )}
      </div>

      <div style={styles.timer}>{formatTime(timeRemaining)}</div>
      <div style={styles.killCount}>Kills: {player.kills} | Deaths: {player.deaths}</div>
      <KillFeed />

      <div style={styles.healthContainer}>
        <div style={styles.healthLabel}>HP</div>
        <div style={styles.healthBar}>
          <div style={{
            ...styles.healthFill,
            width: `${player.health}%`,
            backgroundColor: player.health > 60 ? '#4a4' : player.health > 30 ? '#aa4' : '#a44',
          }} />
        </div>
        <div style={styles.healthText}>{player.health}</div>
      </div>

      <div style={styles.weaponInfo}>
        <div style={styles.weaponName}>{weaponDef.name}</div>
        <div style={styles.ammo}>
          {weaponDef.type === 'melee' ? '---' : `${weaponData.ammo} / ${weaponData.maxAmmo}`}
        </div>
      </div>

      {/* Weapon slots — auto-generated from WEAPON_SLOTS */}
      <div style={styles.weaponSlots}>
        {WEAPON_SLOTS.map(key => (
          <div key={key} style={{
            ...styles.weaponSlot,
            ...(player.weapon === key ? styles.activeSlot : {}),
          }}>
            {WEAPONS[key].slot}. {WEAPONS[key].name}
          </div>
        ))}
      </div>

      {!player.alive && (
        <div style={styles.deathOverlay}>
          <h2 style={{ color: '#ff4444', fontSize: '48px', margin: 0 }}>YOU DIED</h2>
          <p style={{ color: '#ccc' }}>Respawning in {Math.ceil(player.respawnTimer)}s...</p>
        </div>
      )}

      {showScoreboard && (
        <div style={styles.scoreboardOverlay}>
          <div style={styles.scoreboard}>
            <h2 style={{ margin: '0 0 10px', color: '#fff' }}>SCOREBOARD</h2>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Player</th><th style={styles.th}>Kills</th><th style={styles.th}>Deaths</th></tr></thead>
              <tbody>
                <tr style={styles.highlight}>
                  <td style={styles.td}>You</td><td style={styles.td}>{player.kills}</td><td style={styles.td}>{player.deaths}</td>
                </tr>
                {bots.map(b => (
                  <tr key={b.id}><td style={styles.td}>{b.name}</td><td style={styles.td}>{b.kills}</td><td style={styles.td}>{b.deaths}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={styles.hint}>Click to capture mouse</div>
    </>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000 },
  menu: { textAlign: 'center', color: '#fff', fontFamily: 'monospace' },
  title: { fontSize: '48px', margin: '0 0 10px', color: '#ff6644', textShadow: '0 0 20px rgba(255,100,50,0.5)' },
  subtitle: { fontSize: '20px', color: '#aaa', margin: '5px 0' },
  info: { fontSize: '16px', color: '#888', margin: '5px 0 20px' },
  button: { padding: '15px 40px', fontSize: '20px', fontFamily: 'monospace', backgroundColor: '#ff6644', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', marginTop: '20px' },
  controls: { marginTop: '30px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '14px', color: '#999' },
  crosshair: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 },
  crosshairLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.8)' },
  hitLine: { position: 'absolute', width: '12px', height: '2px', backgroundColor: '#ff4444' },
  timer: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '28px', fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,0,0,0.8)', zIndex: 100 },
  killCount: { position: 'fixed', top: '55px', left: '50%', transform: 'translateX(-50%)', color: '#ccc', fontSize: '16px', fontFamily: 'monospace', textShadow: '0 0 10px rgba(0,0,0,0.8)', zIndex: 100 },
  killFeed: { position: 'fixed', top: '80px', right: '20px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100 },
  killFeedEntry: { padding: '4px 10px', fontSize: '13px', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '3px', whiteSpace: 'nowrap' },
  healthContainer: { position: 'fixed', bottom: '40px', left: '30px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 100 },
  healthLabel: { color: '#fff', fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold' },
  healthBar: { width: '200px', height: '20px', backgroundColor: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '3px', overflow: 'hidden' },
  healthFill: { height: '100%', transition: 'width 0.2s, background-color 0.3s' },
  healthText: { color: '#fff', fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', minWidth: '35px' },
  weaponInfo: { position: 'fixed', bottom: '40px', right: '30px', textAlign: 'right', color: '#fff', fontFamily: 'monospace', zIndex: 100 },
  weaponName: { fontSize: '18px', fontWeight: 'bold' },
  ammo: { fontSize: '24px', fontWeight: 'bold' },
  weaponSlots: { position: 'fixed', bottom: '90px', right: '30px', display: 'flex', gap: '5px', zIndex: 100 },
  weaponSlot: { padding: '5px 10px', fontSize: '12px', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.5)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px' },
  activeSlot: { color: '#fff', borderColor: '#ff6644', backgroundColor: 'rgba(255,100,50,0.2)' },
  deathOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(100,0,0,0.3)', zIndex: 200, pointerEvents: 'none' },
  scoreboardOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 300 },
  scoreboard: { padding: '20px', fontFamily: 'monospace' },
  table: { borderCollapse: 'collapse', width: '100%', minWidth: '400px' },
  th: { padding: '8px 15px', borderBottom: '2px solid #555', color: '#aaa', textAlign: 'left', fontFamily: 'monospace' },
  td: { padding: '6px 15px', borderBottom: '1px solid #333', color: '#ddd', fontFamily: 'monospace' },
  highlight: { backgroundColor: 'rgba(255,100,50,0.15)' },
  hint: { position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace', zIndex: 100 },
};
