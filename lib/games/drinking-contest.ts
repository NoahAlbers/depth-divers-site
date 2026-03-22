export const BAR_WIDTH = 350;
export const BAR_HEIGHT = 40;

export interface DrinkingState {
  round: number;
  markerPosition: number; // 0 to BAR_WIDTH
  markerDirection: number; // 1 or -1
  markerSpeed: number; // px/sec
  sweetSpotCenter: number;
  sweetSpotWidth: number;
  stumbles: number;
  maxStumbles: number;
  alive: boolean;
  isBurpRound: boolean;
  burpTimer: number; // countdown for burp display
  waitingForTap: boolean;
  roundResult: "none" | "hit" | "miss" | "burp-ok" | "burp-fail";
  roundResultTimer: number;
  drunkLevel: number; // 0-1 affecting visual effects
}

export function createDrinkingState(): DrinkingState {
  return {
    round: 1,
    markerPosition: 0,
    markerDirection: 1,
    markerSpeed: 120,
    sweetSpotCenter: BAR_WIDTH / 2,
    sweetSpotWidth: 100,
    stumbles: 0,
    maxStumbles: 3,
    alive: true,
    isBurpRound: false,
    burpTimer: 0,
    waitingForTap: true,
    roundResult: "none",
    roundResultTimer: 0,
    drunkLevel: 0,
  };
}

export function setupRound(state: DrinkingState): DrinkingState {
  const s = { ...state };
  const r = s.round;

  s.isBurpRound = r > 1 && r % 5 === 0;
  s.waitingForTap = true;
  s.roundResult = "none";
  s.roundResultTimer = 0;
  s.markerPosition = 0;
  s.markerDirection = 1;

  // Progressive difficulty
  s.markerSpeed = 120 + r * 12;
  s.sweetSpotWidth = Math.max(20, 100 - r * 4);

  // Erratic speed after round 10
  if (r > 10) {
    s.markerSpeed *= 1 + Math.sin(r * 1.7) * 0.3;
  }

  // Drunk level (0-1)
  s.drunkLevel = Math.min(1, (r - 1) / 20);

  if (s.isBurpRound) {
    s.burpTimer = 2.0; // 2 seconds of "WAIT!"
    s.markerPosition = BAR_WIDTH / 2; // marker freezes in center
  }

  return s;
}

export function tickDrinking(state: DrinkingState, dt: number): DrinkingState {
  if (!state.alive) return state;

  const s = { ...state };

  // Result display timer
  if (s.roundResultTimer > 0) {
    s.roundResultTimer -= dt;
    if (s.roundResultTimer <= 0) {
      s.round++;
      return setupRound(s);
    }
    return s;
  }

  // Burp round countdown
  if (s.isBurpRound && s.burpTimer > 0) {
    s.burpTimer -= dt;
    if (s.burpTimer <= 0) {
      // Burp round passed (player didn't tap)
      s.roundResult = "burp-ok";
      s.roundResultTimer = 0.8;
    }
    return s;
  }

  // Move marker
  if (!s.isBurpRound && s.waitingForTap) {
    s.markerPosition += s.markerDirection * s.markerSpeed * dt;

    if (s.markerPosition >= BAR_WIDTH) {
      s.markerPosition = BAR_WIDTH;
      s.markerDirection = -1;
    } else if (s.markerPosition <= 0) {
      s.markerPosition = 0;
      s.markerDirection = 1;
    }
  }

  return s;
}

export function handleDrinkTap(state: DrinkingState): DrinkingState {
  if (!state.alive || state.roundResultTimer > 0) return state;

  const s = { ...state };

  if (s.isBurpRound && s.burpTimer > 0) {
    // Tapped during burp round — stumble!
    s.stumbles++;
    s.roundResult = "burp-fail";
    s.roundResultTimer = 0.8;
    if (s.stumbles >= s.maxStumbles) s.alive = false;
    return s;
  }

  if (!s.waitingForTap) return s;
  s.waitingForTap = false;

  // Check if marker is in sweet spot
  const sweetLeft = s.sweetSpotCenter - s.sweetSpotWidth / 2;
  const sweetRight = s.sweetSpotCenter + s.sweetSpotWidth / 2;

  if (s.markerPosition >= sweetLeft && s.markerPosition <= sweetRight) {
    s.roundResult = "hit";
    s.roundResultTimer = 0.6;
  } else {
    s.stumbles++;
    s.roundResult = "miss";
    s.roundResultTimer = 0.8;
    if (s.stumbles >= s.maxStumbles) s.alive = false;
  }

  return s;
}
