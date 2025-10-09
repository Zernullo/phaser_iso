import Phaser from 'phaser';

class IsoMoveAPIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IsoMoveAPIScene' });
    
    // Grid properties
    this.tileSize = 64;
    this.gridWidth = 8;
    this.gridHeight = 8;
    
    // Player properties
    this.player = null;
    this.playerGridX = 2;
    this.playerGridY = 2;
    this.playerDirection = 0; // 0=North, 1=East, 2=South, 3=West
    
    // Movement state
    this.isMoving = false;
  }

  preload() {
    this.load.image('tile', 'server/assets/tile.png');
  }

  create() {
    // Create player texture and tiles
    this.createPlayerTexture();
    this.spawnTiles();
    this.createPlayer();
    
    // Signal API is ready
    _readyResolve();
  }

  createPlayerTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff4444); // Red color
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
  }

  spawnTiles() {
    this.tiles = this.add.group();
    
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        // Convert grid coordinates to isometric screen coordinates
        const screenPos = this.gridToScreen(x, y);
        
        const tile = this.add.image(screenPos.x, screenPos.y, 'tile');
        tile.setScale(0.8);
        tile.setInteractive();
        
        // Store grid coordinates on the tile
        tile.gridX = x;
        tile.gridY = y;
        
        tile.on('pointerover', function() {
          this.setTint(0x86bfda);
        });

        tile.on('pointerout', function() {
          this.clearTint();
        });
        
        this.tiles.add(tile);
      }
    }
  }
  
  gridToScreen(gridX, gridY) {
    // Simple isometric projection
    const isoX = (gridX - gridY) * (this.tileSize / 2);
    const isoY = (gridX + gridY) * (this.tileSize / 4);
    
    // Center on screen
    return {
      x: 400 + isoX,
      y: 200 + isoY
    };
  }
  
  createPlayer() {
    const screenPos = this.gridToScreen(this.playerGridX, this.playerGridY);
    this.player = this.add.image(screenPos.x, screenPos.y - 20, 'player');
    this.player.setScale(0.8);
    this.player.setDepth(1000); // Always on top
  }

  update() {
    // API controls movement, no keyboard input here
  }
}

// --- Game Configuration ---
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  parent: 'game',
  scene: IsoMoveAPIScene,
  backgroundColor: '#2c3e50'
};

const game = new Phaser.Game(config);

// --- Action Queue System ---
const _queue = [];
let _running = false;
let _readyResolve;
const _ready = new Promise(res => (_readyResolve = res));

function _enqueue(label, fn) {
  return new Promise((resolve, reject) => {
    _queue.push({ label, fn, resolve, reject });
    _drain();
  });
}

async function _drain() {
  if (_running) return;
  _running = true;
  while (_queue.length) {
    const { label, fn, resolve, reject } = _queue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (e) {
      console.error(`[IsoMoveAPI] Action failed: ${label}`, e);
      reject(e);
    }
  }
  _running = false;
}

// --- Public API ---
window.IsoMoveAPI = {
  /** await IsoMoveAPI.ready() before issuing actions */
  ready: () => _ready,

  /** Movement & rotation (Promise-based) */
  turnLeft: () => _enqueue('turnLeft', async () => _turnLeft()),
  turnRight: () => _enqueue('turnRight', async () => _turnRight()),
  moveForward: (steps = 1) => _enqueue('moveForward', async () => _multiStep(true, steps)),
  moveBackward: (steps = 1) => _enqueue('moveBackward', async () => _multiStep(false, steps)),

  /** Utilities */
  face: (direction) => _enqueue('face', async () => _face(direction)),
  setPosition: (gridX, gridY) => _enqueue('setPosition', async () => _setPosition(gridX, gridY)),

  /** Read-only state */
  getState: () => {
    const scene = _getScene();
    if (!scene) return null;
    return {
      direction: scene.playerDirection,
      gridX: scene.playerGridX,
      gridY: scene.playerGridY,
      isMoving: scene.isMoving,
      directionName: ['North', 'East', 'South', 'West'][scene.playerDirection]
    };
  }
};

// --- API Implementation Helpers ---
function _getScene() {
  return game?.scene?.scenes?.[0];
}

function _turnLeft() {
  return new Promise((resolve) => {
    const scene = _getScene();
    if (!scene) return resolve(false);
    
    scene.playerDirection = (scene.playerDirection - 1 + 4) % 4;
    _updatePlayerVisualDirection(scene);
    
    setTimeout(() => resolve(true), 200);
  });
}

function _turnRight() {
  return new Promise((resolve) => {
    const scene = _getScene();
    if (!scene) return resolve(false);
    
    scene.playerDirection = (scene.playerDirection + 1) % 4;
    _updatePlayerVisualDirection(scene);
    
    setTimeout(() => resolve(true), 200);
  });
}

function _updatePlayerVisualDirection(scene) {
  const angle = scene.playerDirection * 90;
  scene.tweens.add({
    targets: scene.player,
    rotation: Phaser.Math.DegToRad(angle),
    duration: 200,
    ease: 'Power2'
  });
}

async function _multiStep(forward, steps) {
  for (let i = 0; i < steps; i++) {
    const success = await _tryStep(forward);
    if (!success) return false;
  }
  return true;
}

function _tryStep(forward) {
  return new Promise((resolve) => {
    const scene = _getScene();
    if (!scene || scene.isMoving) return resolve(false);

    const newPos = forward ? _getForwardPosition(scene) : _getBackwardPosition(scene);
    
    if (!_isValidPosition(scene, newPos.x, newPos.y)) {
      return resolve(false);
    }

    _moveToPosition(scene, newPos.x, newPos.y, resolve);
  });
}

function _getForwardPosition(scene) {
  let newX = scene.playerGridX;
  let newY = scene.playerGridY;
  
  switch (scene.playerDirection) {
    case 0: newY -= 1; break; // North
    case 1: newX += 1; break; // East
    case 2: newY += 1; break; // South
    case 3: newX -= 1; break; // West
  }
  
  return { x: newX, y: newY };
}

function _getBackwardPosition(scene) {
  let newX = scene.playerGridX;
  let newY = scene.playerGridY;
  
  switch (scene.playerDirection) {
    case 0: newY += 1; break; // North (go South)
    case 1: newX -= 1; break; // East (go West)
    case 2: newY -= 1; break; // South (go North)
    case 3: newX += 1; break; // West (go East)
  }
  
  return { x: newX, y: newY };
}

function _isValidPosition(scene, x, y) {
  return x >= 0 && x < scene.gridWidth && y >= 0 && y < scene.gridHeight;
}

function _moveToPosition(scene, gridX, gridY, callback) {
  scene.isMoving = true;
  
  const screenPos = scene.gridToScreen(gridX, gridY);
  
  scene.tweens.add({
    targets: scene.player,
    x: screenPos.x,
    y: screenPos.y - 20,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      scene.playerGridX = gridX;
      scene.playerGridY = gridY;
      scene.isMoving = false;
      callback(true);
    }
  });
}

function _face(directionName) {
  const scene = _getScene();
  if (!scene) return false;
  
  const dirMap = { 
    'north': 0, 'up': 0,
    'east': 1, 'right': 1,
    'south': 2, 'down': 2,
    'west': 3, 'left': 3
  };
  
  const dir = dirMap[directionName.toLowerCase()];
  if (dir === undefined) return false;
  
  scene.playerDirection = dir;
  _updatePlayerVisualDirection(scene);
  return true;
}

function _setPosition(gridX, gridY) {
  const scene = _getScene();
  if (!scene || !_isValidPosition(scene, gridX, gridY)) return false;
  
  const screenPos = scene.gridToScreen(gridX, gridY);
  scene.player.x = screenPos.x;
  scene.player.y = screenPos.y - 20;
  scene.playerGridX = gridX;
  scene.playerGridY = gridY;
  
  return true;
}