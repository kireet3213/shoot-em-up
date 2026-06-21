import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useGameStore from '../store/gameStore';
import { WEAPONS } from '../config/weapons';

// ============================================================
// WEAPON MODEL REGISTRY
// To add a visual model for a new weapon:
//   1. Create a function component like the ones below
//   2. Register it in WEAPON_MODELS with the weapon key
//   3. It will auto-render when that weapon is equipped
// ============================================================

function MuzzleFlash({ position }) {
  const flash = useGameStore(s => s.muzzleFlash);
  if (!flash) return null;
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffdd44" />
      </mesh>
      <pointLight color="#ffaa33" intensity={3} distance={2} decay={2} />
    </group>
  );
}

function KnifeModel() {
  return (
    <group position={[0.3, -0.3, -0.5]} rotation={[0, 0, -0.2]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.025, 0.15, 8]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.01, 0.2, 0.04]} />
        <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function PistolModel() {
  return (
    <group position={[0.25, -0.25, -0.4]}>
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.2]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.02, 0.02]}>
        <boxGeometry args={[0.05, 0.06, 0.12]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.08, 0.06]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <MuzzleFlash position={[0, 0, -0.22]} />
    </group>
  );
}

function SMGModel() {
  return (
    <group position={[0.2, -0.25, -0.5]}>
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[0.03, 0.03, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.06, 0.07, 0.25]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.06]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, -0.01, 0.2]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.15]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh position={[0, -0.08, 0.12]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <MuzzleFlash position={[0, 0, -0.32]} />
    </group>
  );
}

function ShotgunModel() {
  return (
    <group position={[0.2, -0.28, -0.5]}>
      {/* Barrel */}
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Second barrel */}
      <mesh position={[0.03, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Receiver */}
      <mesh position={[0.015, -0.01, 0.05]}>
        <boxGeometry args={[0.08, 0.07, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Stock */}
      <mesh position={[0.015, -0.02, 0.25]} rotation={[0.05, 0, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.25]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      {/* Pump grip */}
      <mesh position={[0.015, -0.06, -0.08]}>
        <boxGeometry args={[0.05, 0.04, 0.1]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      {/* Trigger guard */}
      <mesh position={[0.015, -0.08, 0.08]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <MuzzleFlash position={[0.015, 0, -0.46]} />
    </group>
  );
}

// Registry: weapon key -> model component
const WEAPON_MODELS = {
  knife: KnifeModel,
  pistol: PistolModel,
  smg: SMGModel,
  shotgun: ShotgunModel,
};

export default function Weapon() {
  const groupRef = useRef();
  const recoilRef = useRef(0);
  const bobPhase = useRef(0);
  const weapon = useGameStore(s => s.player.weapon);
  const alive = useGameStore(s => s.player.alive);
  const flash = useGameStore(s => s.muzzleFlash);

  useFrame((_, delta) => {
    if (!groupRef.current || !alive) return;

    bobPhase.current += delta * 5;
    groupRef.current.position.y = Math.sin(bobPhase.current) * 0.01;
    groupRef.current.position.x = Math.cos(bobPhase.current * 0.5) * 0.005;

    if (flash) recoilRef.current = 0.03;
    if (recoilRef.current > 0) {
      recoilRef.current *= 0.85;
      groupRef.current.position.z = recoilRef.current;
      groupRef.current.rotation.x = -recoilRef.current * 2;
    } else {
      groupRef.current.position.z = 0;
      groupRef.current.rotation.x = 0;
    }
  });

  if (!alive) return null;

  const ModelComponent = WEAPON_MODELS[weapon];
  if (!ModelComponent) return null;

  return (
    <group ref={groupRef}>
      <ModelComponent />
    </group>
  );
}

export { WEAPON_MODELS };
