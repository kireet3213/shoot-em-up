import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import useGameStore from '../store/gameStore';
import { getBotConfig } from '../config/bots';

export default function Bot({ bot }) {
  const bodyRef = useRef();
  const lastShot = useRef(0);
  const wanderDir = useRef(new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const wanderTimer = useRef(0);
  const wasAlive = useRef(bot.alive);
  const muzzleFlash = useRef(false);
  const muzzleTimer = useRef(0);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;

    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    const currentBot = store.bots.find(b => b.id === bot.id);
    if (!currentBot) return;

    // Load AI config from preset
    const cfg = getBotConfig(currentBot.preset);

    // Handle respawn teleport
    if (!wasAlive.current && currentBot.alive) {
      const sp = currentBot.position;
      bodyRef.current.setTranslation({ x: sp[0], y: sp[1], z: sp[2] }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      wasAlive.current = true;
      return;
    }
    wasAlive.current = currentBot.alive;

    if (!currentBot.alive) {
      bodyRef.current.setTranslation({ x: 0, y: -100, z: 0 }, true);
      return;
    }

    const pos = bodyRef.current.translation();
    const botPos = new Vector3(pos.x, pos.y, pos.z);

    store.updateBotPosition(bot.id, [pos.x, pos.y, pos.z], [0, 0, 0]);

    // Muzzle flash timer
    if (muzzleFlash.current) {
      muzzleTimer.current -= delta;
      if (muzzleTimer.current <= 0) muzzleFlash.current = false;
    }

    // Find nearest target (FFA: player + other bots)
    let target = null;
    let targetDist = Infinity;
    let targetIsPlayer = false;
    let targetEntity = null;

    if (store.player.alive) {
      const pp = store.player.position;
      const playerPos = new Vector3(pp[0], pp[1], pp[2]);
      const dist = botPos.distanceTo(playerPos);
      if (dist < cfg.visionRange) {
        target = playerPos;
        targetDist = dist;
        targetIsPlayer = true;
      }
    }

    for (const otherBot of store.bots) {
      if (otherBot.id === bot.id || !otherBot.alive) continue;
      const otherPos = new Vector3(otherBot.position[0], otherBot.position[1], otherBot.position[2]);
      const dist = botPos.distanceTo(otherPos);
      if (dist < cfg.visionRange && dist < targetDist) {
        target = otherPos;
        targetDist = dist;
        targetIsPlayer = false;
        targetEntity = otherBot;
      }
    }

    if (target) {
      // Combat movement
      const dir = target.clone().sub(botPos);
      dir.y = 0;
      dir.normalize();

      const strafeAngle = Math.sin(Date.now() * 0.003 + bot.id) * 0.5;
      const strafeDir = new Vector3(-dir.z, 0, dir.x).multiplyScalar(strafeAngle);

      let moveDir;
      if (targetDist > cfg.engageDistance) {
        moveDir = dir.clone().add(strafeDir).normalize();
      } else if (targetDist < cfg.retreatDistance) {
        moveDir = dir.clone().negate().add(strafeDir).normalize();
      } else {
        moveDir = strafeDir.length() > 0.01 ? strafeDir.normalize() : dir;
      }

      const vel = bodyRef.current.linvel();
      bodyRef.current.setLinvel(
        { x: moveDir.x * cfg.speed, y: vel.y, z: moveDir.z * cfg.speed },
        true
      );

      // Shoot
      const now = Date.now();
      if (now - lastShot.current > cfg.fireRate && targetDist < cfg.visionRange) {
        lastShot.current = now;
        muzzleFlash.current = true;
        muzzleTimer.current = 0.05;

        const hitChance = Math.max(0.2, 1 - (targetDist / cfg.visionRange) - cfg.accuracy);
        if (Math.random() < hitChance) {
          if (targetIsPlayer) {
            store.damagePlayer(cfg.damage, [pos.x, pos.y, pos.z]);
            if (store.player.health - cfg.damage <= 0) {
              store.addBotKill(bot.id);
              store.addKillFeedEntry(currentBot.name, 'You');
            }
          } else if (targetEntity) {
            store.damageBot(targetEntity.id, cfg.damage, currentBot.name);
            if (targetEntity.health - cfg.damage <= 0) {
              store.addBotKill(bot.id);
            }
          }
        }
      }
    } else {
      // Wander
      wanderTimer.current -= delta;
      if (wanderTimer.current <= 0) {
        wanderDir.current = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        wanderTimer.current = cfg.wanderInterval + Math.random() * 2;
      }

      if (Math.abs(pos.x) > 22 || Math.abs(pos.z) > 22) {
        wanderDir.current = new Vector3(-pos.x, 0, -pos.z).normalize();
      }

      const vel = bodyRef.current.linvel();
      bodyRef.current.setLinvel({
        x: wanderDir.current.x * cfg.speed * cfg.wanderSpeed,
        y: vel.y,
        z: wanderDir.current.z * cfg.speed * cfg.wanderSpeed,
      }, true);
    }

    bodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  });

  const spawnPos = bot.position || [0, 1, 0];

  return (
    <RigidBody
      ref={bodyRef}
      position={spawnPos}
      enabledRotations={[false, false, false]}
      mass={1}
      lockRotations
      linearDamping={0.5}
    >
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 0.8, 0]} />
      <group position={[0, 0.8, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.4, 1, 8, 16]} />
          <meshStandardMaterial color="#cc3333" />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#cc5555" />
        </mesh>
        <mesh position={[0.3, 0.1, -0.4]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.3, 0.1, -0.7]} visible={muzzleFlash.current}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#ffaa33" transparent opacity={0.9} />
        </mesh>
      </group>
    </RigidBody>
  );
}
