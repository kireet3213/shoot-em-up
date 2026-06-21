import { RigidBody } from '@react-three/rapier';
import { LEVELS } from '../config/levels';
import useGameStore from '../store/gameStore';

function Wall({ position, size, color }) {
  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function Obstacle({ position, size, color }) {
  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

export default function Arena() {
  const currentLevel = useGameStore(s => s.currentLevel);
  const level = LEVELS[currentLevel];
  if (!level) return null;

  const { size, wallHeight, floorColor, wallColor, obstacles, lighting } = level;

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed">
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[size, size]} />
          <meshStandardMaterial color={floorColor} />
        </mesh>
      </RigidBody>

      {/* Walls (auto-generated from size) */}
      <Wall position={[0, wallHeight / 2, -size / 2]} size={[size, wallHeight, 1]} color={wallColor} />
      <Wall position={[0, wallHeight / 2, size / 2]} size={[size, wallHeight, 1]} color={wallColor} />
      <Wall position={[-size / 2, wallHeight / 2, 0]} size={[1, wallHeight, size]} color={wallColor} />
      <Wall position={[size / 2, wallHeight / 2, 0]} size={[1, wallHeight, size]} color={wallColor} />

      {/* Obstacles from level config */}
      {obstacles.map((obs, i) => (
        <Obstacle
          key={i}
          position={obs.position}
          size={obs.size}
          color={obs.color}
        />
      ))}

      {/* Lighting from level config */}
      <ambientLight intensity={lighting.ambient} />
      <directionalLight
        position={lighting.directional.position}
        intensity={lighting.directional.intensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {lighting.points.map((pl, i) => (
        <pointLight
          key={i}
          position={pl.position}
          intensity={pl.intensity}
          color={pl.color}
        />
      ))}
    </group>
  );
}
