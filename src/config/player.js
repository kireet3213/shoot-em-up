// ============================================================
// PLAYER CONFIGURATION
// Tweak movement, physics, and camera settings here.
// All values are used by the Player component.
// ============================================================

const PLAYER_CONFIG = {
  moveSpeed: 8,
  mouseSensitivity: 0.002,
  jumpForce: 5,
  height: 0.8,          // camera offset above physics body center
  collider: {
    halfHeight: 0.5,    // capsule half-height
    radius: 0.5,        // capsule radius
    offsetY: 0.8,       // collider vertical offset
  },
  physics: {
    mass: 1,
    linearDamping: 0.5,
  },
};

export { PLAYER_CONFIG };
