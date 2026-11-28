// The Great Turkey Escape — bootstrap.
// Finds the canvas, builds the game and starts the loop. Nothing here
// is gameplay: the game object owns all of that.

import { createGame } from './game.js';

const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('The Great Turkey Escape: no #game canvas in the page');
}

const game = createGame(canvas);
game.start();
