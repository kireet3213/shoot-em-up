// ============================================================
// LEVEL REGISTRY
// To add a new level:
//   1. Add an entry to LEVELS with a unique key
//   2. Define floor, walls, obstacles, spawns, and lighting
//   3. Set it as the active level in CURRENT_LEVEL or add a level picker
//
// Obstacle types:
//   { position: [x,y,z], size: [w,h,d], color: '#hex' }
//
// Spawn points:
//   [x, y, z]  -- y should be ~1 for ground level
// ============================================================

const LEVELS = {
  box_arena: {
    name: 'Box Arena',
    size: 50,
    wallHeight: 8,
    floorColor: '#3a3a3a',
    wallColor: '#664433',
    fog: { color: '#1a1a2e', near: 30, far: 60 },

    lighting: {
      ambient: 0.4,
      directional: {
        position: [20, 30, 10],
        intensity: 1,
      },
      points: [
        { position: [0, 6, 0], intensity: 0.5, color: '#ffaa77' },
      ],
    },

    spawns: [
      [-20, 1, -20],
      [20, 1, -20],
      [-20, 1, 20],
      [20, 1, 20],
      [0, 1, 0],
      [-15, 1, 0],
      [15, 1, 0],
      [0, 1, -15],
      [0, 1, 15],
    ],

    obstacles: [
      // Center cross
      { position: [0, 1.5, 0], size: [6, 3, 1], color: '#886644' },
      { position: [0, 1.5, 0], size: [1, 3, 6], color: '#886644' },

      // Corner covers
      { position: [-15, 1, -15], size: [4, 2, 4], color: '#667766' },
      { position: [15, 1, -15], size: [4, 2, 4], color: '#667766' },
      { position: [-15, 1, 15], size: [4, 2, 4], color: '#667766' },
      { position: [15, 1, 15], size: [4, 2, 4], color: '#667766' },

      // Mid-range walls
      { position: [-10, 1.5, 0], size: [1, 3, 8], color: '#776655' },
      { position: [10, 1.5, 0], size: [1, 3, 8], color: '#776655' },
      { position: [0, 1.5, -10], size: [8, 3, 1], color: '#776655' },
      { position: [0, 1.5, 10], size: [8, 3, 1], color: '#776655' },

      // Small crates
      { position: [-7, 0.75, -7], size: [1.5, 1.5, 1.5], color: '#998866' },
      { position: [7, 0.75, -7], size: [1.5, 1.5, 1.5], color: '#998866' },
      { position: [-7, 0.75, 7], size: [1.5, 1.5, 1.5], color: '#998866' },
      { position: [7, 0.75, 7], size: [1.5, 1.5, 1.5], color: '#998866' },

      // Tall pillars
      { position: [-20, 2.5, -10], size: [2, 5, 2], color: '#555566' },
      { position: [20, 2.5, -10], size: [2, 5, 2], color: '#555566' },
      { position: [-20, 2.5, 10], size: [2, 5, 2], color: '#555566' },
      { position: [20, 2.5, 10], size: [2, 5, 2], color: '#555566' },
    ],
  },

  // ---- EXAMPLE: adding a new level ----
  // warehouse: {
  //   name: 'Warehouse',
  //   size: 40,
  //   wallHeight: 6,
  //   floorColor: '#4a4a3a',
  //   wallColor: '#555544',
  //   fog: { color: '#2a2a1e', near: 25, far: 50 },
  //   lighting: {
  //     ambient: 0.3,
  //     directional: { position: [10, 20, 5], intensity: 0.8 },
  //     points: [
  //       { position: [-10, 5, -10], intensity: 0.6, color: '#ffddaa' },
  //       { position: [10, 5, 10], intensity: 0.6, color: '#ffddaa' },
  //     ],
  //   },
  //   spawns: [
  //     [-15, 1, -15], [15, 1, -15], [-15, 1, 15], [15, 1, 15],
  //   ],
  //   obstacles: [
  //     { position: [0, 1.5, 0], size: [8, 3, 2], color: '#7a6a5a' },
  //     { position: [-8, 1, -8], size: [3, 2, 3], color: '#6a6a5a' },
  //     { position: [8, 1, 8], size: [3, 2, 3], color: '#6a6a5a' },
  //   ],
  // },
};

const LEVEL_KEYS = Object.keys(LEVELS);

export { LEVELS, LEVEL_KEYS };
