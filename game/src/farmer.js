// The farmer: the chaser who never stops coming.
// One job: track how close the farmer is and how he hunts.

function makeFarmer() {
  return {
    proximity: 0,
    searching: false,
    searchTimer: 0,
    stepPhase: 0,
    shoutTimer: 0,
    shout: "",
  };
}

function farmerScreenX(farmer) {
  const p = farmer.proximity;
  return -70 + p * 250;
}

function updateFarmer(farmer, dt, game) {
  const hidden = game.hidden;
  if (hidden) {
    farmer.proximity -= CONFIG.hideDecayPerSecond * dt;
    farmer.searching = true;
    farmer.searchTimer = 1.2;
    farmer.shout = "Where'd it go?!";
  } else {
    farmer.proximity -= CONFIG.farmerDecayPerSecond * dt;
    if (farmer.searchTimer > 0) {
      farmer.searchTimer -= dt;
      if (farmer.searchTimer <= 0) farmer.searching = false;
    }
  }
  if (farmer.proximity < 0) farmer.proximity = 0;
  if (farmer.proximity > CONFIG.farmerCatch) farmer.proximity = CONFIG.farmerCatch;
  farmer.stepPhase += dt * (6 + farmer.proximity * 10);
  if (farmer.shoutTimer > 0) farmer.shoutTimer -= dt;
}

function farmerTaunt(farmer, text) {
  farmer.shout = text;
  farmer.shoutTimer = 1.4;
}

function farmerGain(farmer, amount) {
  farmer.proximity += amount;
  if (farmer.proximity > CONFIG.farmerCatch) farmer.proximity = CONFIG.farmerCatch;
}

function farmerCaught(farmer) {
  return farmer.proximity >= CONFIG.farmerCatch;
}

function resetFarmer(farmer) {
  farmer.proximity = 0;
  farmer.searching = false;
  farmer.searchTimer = 0;
  farmer.stepPhase = 0;
  farmer.shoutTimer = 0;
  farmer.shout = "";
}
