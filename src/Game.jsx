import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import Arena from './components/Arena';
import Player from './components/Player';
import Bot from './components/Bot';
import Weapon from './components/Weapon';
import Projectiles from './components/Projectiles';
import HUD from './components/HUD';
import useGameStore from './store/gameStore';
import { LEVELS } from './config/levels';

function LevelFog() {
  const currentLevel = useGameStore(s => s.currentLevel);
  const level = LEVELS[currentLevel];
  if (!level) return null;
  const { fog } = level;
  return <fog attach="fog" args={[fog.color, fog.near, fog.far]} />;
}

function Scene() {
  const bots = useGameStore(s => s.bots);
  const gameState = useGameStore(s => s.gameState);

  if (gameState === 'menu') return null;

  return (
    <>
      <Sky
        sunPosition={[100, 10, 100]}
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <Physics gravity={[0, -15, 0]}>
        <Arena />
        <Player />
        {bots.map(bot => (
          <Bot key={bot.id} bot={bot} />
        ))}
        <Weapon />
        <Projectiles />
      </Physics>
    </>
  );
}

export default function Game() {
  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.01, far: 200 }}
        style={{ width: '100vw', height: '100vh' }}
        onCreated={({ gl }) => { gl.shadowMap.enabled = true; }}
      >
        <Suspense fallback={null}>
          <LevelFog />
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  );
}
