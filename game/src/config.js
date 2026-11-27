// Game tuning and stage definitions for The Great Turkey Getaway.
// One job: every number the rest of the game reads, in one place.

const CONFIG = {
  canvasWidth: 960,
  canvasHeight: 540,
  groundY: 470,
  gravity: 2400,
  jumpVelocity: -820,
  baseSpeed: 265,
  maxSpeed: 430,
  speedRampMeters: 1400,
  startLives: 3,
  cornScore: 10,
  stageBonus: 250,
  escapeDistance: 1400,
  farmerCatch: 1,
  farmerDecayPerSecond: 0.022,
  stumbleGain: 0.22,
  hitGain: 0.15,
  hideDecayPerSecond: 0.25,
  invulnerableSeconds: 1.5,
};

const STAGES = [
  {
    key: "farmyard",
    name: "THE FARMYARD",
    from: 0,
    skyTop: "#f7b733",
    skyBottom: "#fcdd8a",
    hill: "#c98a3d",
    ground: "#8a5a2b",
    grass: "#7da23f",
    hint: "Jump the fences, grab the corn!",
  },
  {
    key: "barn",
    name: "THE BARN",
    from: 400,
    skyTop: "#e88a4a",
    skyBottom: "#f9c784",
    hill: "#a8642f",
    ground: "#6e4520",
    grass: "#a8a03a",
    hint: "Haystacks hide you — duck inside one!",
  },
  {
    key: "kitchen",
    name: "THE KITCHEN",
    from: 900,
    skyTop: "#8f3b2f",
    skyBottom: "#e0784a",
    hill: "#5e2a22",
    ground: "#4a2c1e",
    grass: "#b0562f",
    hint: "Dodge the knives — mind the oven!",
  },
];

function stageFor(distanceMeters) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (distanceMeters >= stage.from) current = stage;
  }
  return current;
}

function stageIndexFor(distanceMeters) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (distanceMeters >= STAGES[i].from) index = i;
  }
  return index;
}

function speedFor(distanceMeters) {
  const ratio = Math.min(1, distanceMeters / CONFIG.speedRampMeters);
  return CONFIG.baseSpeed + (CONFIG.maxSpeed - CONFIG.baseSpeed) * ratio;
}

function spawnGapFor(distanceMeters) {
  const ratio = Math.min(1, distanceMeters / CONFIG.speedRampMeters);
  return 1.05 - 0.35 * ratio;
}
