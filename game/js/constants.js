// The Great Turkey Escape — tuning constants.
// One place for every number the game balances on, so a tweak never
// means hunting through the turkey, the farmer or the world.

export const CFG = {
  // Canvas and ground.
  width: 1280,
  height: 720,
  groundY: 620,

  // The turkey runs at a fixed screen x; the world scrolls past it.
  turkeyX: 300,
  turkeyW: 62,
  turkeyH: 84,
  turkeyDuckH: 50,

  // Jump physics (pixels, seconds).
  gravity: 2600,
  jumpVelocity: 980,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,

  // Run speed in pixels per second; it grows with distance.
  baseSpeed: 380,
  maxSpeed: 580,
  pxPerMeter: 28,

  // The race: farmyard, then kitchen, then the forest gate.
  farmEnd: 700,
  kitchenEnd: 1200,

  // Lives and the farmer gap (pixels between turkey and farmer).
  lives: 3,
  gapStart: 230,
  gapMax: 320,
  gapCatch: 0,
  gapWarn: 110,
  gapHideBonus: 150,
  gapHitSurge: 45,
  gapStumble: 30,
  invulnTime: 1.5,

  // The farmer's pressure: pixels per second the gap closes.
  farmerBasePressure: 5,
  farmerPerMeter: 0.003,
  farmerKitchenExtra: 1,
  farmerSearchTime: 1.5,

  // Spawning (seconds between spawns; they shrink as it gets harder).
  obstacleEvery: [1.15, 0.95],
  cornEvery: 2.3,
  hayEveryFarm: [8, 12],
  hayEveryKitchen: [9, 13],
  knifeEvery: 5.0,
  ovenEvery: 13,

  // Scoring.
  cornPoints: 10,
  hidePoints: 50,
  escapeBonus: 500,
};

// One coherent autumn palette for the farm, the kitchen and the forest.
export const COLORS = {
  skyFarmTop: '#f7b733',
  skyFarmBottom: '#fbd786',
  skyKitchenTop: '#c96f3f',
  skyKitchenBottom: '#e8a06a',
  skyForestTop: '#2e4d33',
  skyForestBottom: '#5d7a52',
  hillFar: '#d99a2b',
  hillNear: '#b97a1e',
  groundFarm: '#8a5a22',
  groundFarmDark: '#6e4518',
  grass: '#5da24a',
  barnRed: '#b23a2e',
  barnRoof: '#7c2a20',
  leafOrange: '#e07b2a',
  leafRed: '#c0392b',
  leafYellow: '#f2c14e',
  trunk: '#6b4423',
  fence: '#8a5a2b',
  hay: '#e8b64c',
  hayDark: '#c98f2e',
  pumpkin: '#e67e22',
  tileWall: '#a8542f',
  tileDark: '#8a3f22',
  counter: '#7a4a21',
  counterTop: '#a06a35',
  ovenSteel: '#9aa5ad',
  ovenDark: '#5d6b73',
  ovenGlow: '#ff7a1a',
  flame: '#ff9d00',
  flameCore: '#ffe066',
  knifeBlade: '#dfe6ea',
  knifeHandle: '#5b3a1e',
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6b4423',
  turkeyTail: '#a06a35',
  turkeyTailDark: '#7c4f22',
  turkeyHead: '#e8c39a',
  beak: '#f39c12',
  wattle: '#d6262e',
  leg: '#f39c12',
  farmerShirt: '#c0392b',
  farmerShirtCheck: '#e74c3c',
  farmerOveralls: '#2e5fa3',
  farmerSkin: '#f2c89b',
  farmerHat: '#d9a441',
  farmerHatBand: '#7c4f22',
  hudBar: 'rgba(40, 20, 8, 0.72)',
  hudText: '#ffe9b0',
  warnRed: '#ff3b30',
  heart: '#ff3b30',
  heartEmpty: '#5a3a2e',
};
