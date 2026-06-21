import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useGameStore from '../store/gameStore';

const PROJECTILE_SPEED = 80;

function Projectile({ data }) {
  const meshRef = useRef();
  const startTime = useRef(Date.now());
  const removed = useRef(false);

  useFrame(() => {
    if (!meshRef.current || removed.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    const dist = elapsed * PROJECTILE_SPEED;

    if (dist >= data.maxDistance) {
      removed.current = true;
      useGameStore.getState().removeProjectile(data.id);
      return;
    }

    meshRef.current.position.set(
      data.origin[0] + data.direction[0] * dist,
      data.origin[1] + data.direction[1] * dist,
      data.origin[2] + data.direction[2] * dist,
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial color="#ffcc33" />
    </mesh>
  );
}

export default function Projectiles() {
  const projectiles = useGameStore(s => s.projectiles);
  return (
    <>
      {projectiles.map(p => (
        <Projectile key={p.id} data={p} />
      ))}
    </>
  );
}
