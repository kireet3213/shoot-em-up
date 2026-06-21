import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import useGameStore from '../store/gameStore';
import { WEAPONS, SLOT_TO_WEAPON } from '../config/weapons';
import { PLAYER_CONFIG } from '../config/player';
import { playWeaponSound, playHit, playKill, playRespawn, playEmpty, playReload, playDamage } from '../lib/audio';

const { moveSpeed, mouseSensitivity, jumpForce, height, collider, physics } = PLAYER_CONFIG;

export default function Player() {
  const bodyRef = useRef();
  const { camera, gl } = useThree();
  const { rapier, world } = useRapier();

  const keys = useRef({});
  const mouseDown = useRef(false);
  const lastShot = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isLocked = useRef(false);
  const wasAlive = useRef(true);
  const lastHealth = useRef(100);

  const player = useGameStore(s => s.player);
  const gameState = useGameStore(s => s.gameState);

  useEffect(() => {
    const canvas = gl.domElement;

    const onClick = () => {
      if (gameState === 'playing') canvas.requestPointerLock();
    };

    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };

    const onKeyDown = (e) => {
      keys.current[e.code] = true;

      // Weapon switching via slot numbers (Digit1, Digit2, etc.)
      const digitMatch = e.code.match(/^Digit(\d)$/);
      if (digitMatch) {
        const slot = parseInt(digitMatch[1]);
        const weaponKey = SLOT_TO_WEAPON[slot];
        if (weaponKey) useGameStore.getState().switchWeapon(weaponKey);
      }

      if (e.code === 'KeyR') {
        useGameStore.getState().reload();
        playReload();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        useGameStore.getState().toggleScoreboard(true);
      }
    };

    const onKeyUp = (e) => {
      keys.current[e.code] = false;
      if (e.code === 'Tab') useGameStore.getState().toggleScoreboard(false);
    };

    const onMouseMove = (e) => {
      if (!isLocked.current) return;
      yaw.current -= e.movementX * mouseSensitivity;
      pitch.current -= e.movementY * mouseSensitivity;
      pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current));
    };

    const onMouseDown = (e) => { if (e.button === 0) mouseDown.current = true; };
    const onMouseUp = (e) => { if (e.button === 0) mouseDown.current = false; };

    canvas.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [gl, gameState]);

  const shoot = useCallback(() => {
    const store = useGameStore.getState();
    const { player } = store;
    if (!player.alive) return;

    const weaponKey = player.weapon;
    const weaponData = WEAPONS[weaponKey];
    if (!weaponData) return;

    const now = Date.now();
    if (now - lastShot.current < weaponData.fireRate) return;

    // Check ammo (melee weapons have infinite)
    if (weaponData.type !== 'melee' && player.weapons[weaponKey].ammo <= 0) {
      playEmpty();
      lastShot.current = now;
      return;
    }

    lastShot.current = now;
    if (weaponData.type !== 'melee') store.consumeAmmo();

    // Play weapon sound from registry
    playWeaponSound(weaponData.sound);

    // Muzzle flash
    store.triggerMuzzleFlash();

    // Fire one or more pellets (shotgun fires multiple)
    const pelletCount = weaponData.pellets || 1;
    const origin = camera.position.clone();
    const baseDir = new Vector3(0, 0, -1);
    baseDir.applyEuler(new Euler(pitch.current, yaw.current, 0, 'YXZ'));
    let anyHit = false;

    for (let p = 0; p < pelletCount; p++) {
      const direction = baseDir.clone();
      direction.x += (Math.random() - 0.5) * weaponData.spread;
      direction.y += (Math.random() - 0.5) * weaponData.spread;
      direction.normalize();

      const ray = new rapier.Ray(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z }
      );
      const hit = world.castRay(ray, weaponData.range, true, undefined, undefined, undefined, bodyRef.current);

      if (hit) {
        const hp = ray.pointAt(hit.timeOfImpact);

        const aliveBots = store.bots.filter(b => b.alive);
        for (const bot of aliveBots) {
          const dx = hp.x - bot.position[0];
          const dy = hp.y - bot.position[1];
          const dz = hp.z - bot.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 1.5) {
            const botBefore = store.bots.find(b => b.id === bot.id);
            store.damageBot(bot.id, weaponData.damage);
            if (botBefore.health - weaponData.damage <= 0) {
              if (!anyHit) playKill();
            } else {
              if (!anyHit) playHit();
            }
            anyHit = true;
            break;
          }
        }
      }

      // Spawn visual projectile (skip for melee)
      if (weaponData.type !== 'melee') {
        const projStart = origin.clone().add(direction.clone().multiplyScalar(1.5));
        const hitDist = hit ? hit.timeOfImpact : weaponData.range;
        store.addProjectile(
          [projStart.x, projStart.y, projStart.z],
          [direction.x, direction.y, direction.z],
          Math.max(hitDist - 1.5, 0.5)
        );
      }
    }
  }, [camera, rapier, world]);

  useFrame((_, delta) => {
    if (gameState !== 'playing' || !bodyRef.current) return;

    const store = useGameStore.getState();
    store.tick(delta);

    // Respawn teleport
    if (store.player.needsRespawnTeleport && store.player.alive) {
      const sp = store.player.position;
      bodyRef.current.setTranslation({ x: sp[0], y: sp[1], z: sp[2] }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      store.setPlayerPosition(sp);
      useGameStore.setState(state => ({
        player: { ...state.player, needsRespawnTeleport: false }
      }));
      playRespawn();
      wasAlive.current = true;
      lastHealth.current = store.player.health;
      return;
    }

    // Play damage sound when health drops (but not on death — that has its own sound)
    if (store.player.health < lastHealth.current && store.player.alive) {
      playDamage();
    }
    lastHealth.current = store.player.health;

    // Death transition
    if (wasAlive.current && !store.player.alive) {
      wasAlive.current = false;
    }

    if (!store.player.alive) {
      bodyRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
      camera.position.set(0, 30, 30);
      camera.lookAt(0, 0, 0);
      return;
    }

    // Camera rotation
    const euler = new Euler(pitch.current, yaw.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Movement
    const forward = new Vector3(0, 0, -1).applyEuler(new Euler(0, yaw.current, 0));
    const right = new Vector3(1, 0, 0).applyEuler(new Euler(0, yaw.current, 0));

    const velocity = bodyRef.current.linvel();
    let mx = 0, mz = 0;

    if (keys.current['KeyW']) { mx += forward.x; mz += forward.z; }
    if (keys.current['KeyS']) { mx -= forward.x; mz -= forward.z; }
    if (keys.current['KeyA']) { mx -= right.x; mz -= right.z; }
    if (keys.current['KeyD']) { mx += right.x; mz += right.z; }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx = (mx / len) * moveSpeed; mz = (mz / len) * moveSpeed; }

    bodyRef.current.setLinvel({ x: mx, y: velocity.y, z: mz }, true);

    // Jump
    const pos = bodyRef.current.translation();
    if (keys.current['Space'] && pos.y < 1.5) {
      bodyRef.current.setLinvel({ x: velocity.x, y: jumpForce, z: velocity.z }, true);
    }

    camera.position.set(pos.x, pos.y + height, pos.z);
    store.setPlayerPosition([pos.x, pos.y, pos.z]);

    if (mouseDown.current) shoot();
  });

  const spawnPos = player.position || [0, 1, 0];

  return (
    <RigidBody
      ref={bodyRef}
      position={spawnPos}
      enabledRotations={[false, false, false]}
      mass={physics.mass}
      lockRotations
      linearDamping={physics.linearDamping}
    >
      <CapsuleCollider
        args={[collider.halfHeight, collider.radius]}
        position={[0, collider.offsetY, 0]}
      />
    </RigidBody>
  );
}
