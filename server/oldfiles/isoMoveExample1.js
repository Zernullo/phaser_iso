import Phaser, { Game, Scene } from 'phaser';
import IsoPlugin from 'phaser3-plugin-isometric';

class IsoMoveExample extends Phaser.Scene {
  constructor() {
    const sceneConfig = {
      key: 'IsoMoveExample',
      mapAdd: { isoPlugin: 'iso' }
    };

    super(sceneConfig);
    
    // Grid properties (matching isoInteractionExample)
    this.tileSize = 38;
    this.gridWidth = 7;  // 256/38 ≈ 6.7, so 7 tiles
    this.gridHeight = 7;
    
    // Player properties
    this.player = null;
    this.playerGridX = 2;
    this.playerGridY = 2;
    this.playerDirection = 0; // 0=North, 1=East, 2=South, 3=West
    
    // Movement
    this.cursors = null;
    this.wasd = null;
    this.isMoving = false;
  }

  preload() {
    this.load.image('tile', 'assets/tile.png');
    this.load.scenePlugin({
      key: 'IsoPlugin',
      url: IsoPlugin,
      sceneKey: 'iso'
    });
  }

  create() {
    this.isoGroup = this.add.group();
    this.playerGroup = this.add.group();

    this.iso.projector.origin.setTo(0.5, 0.3);

    // Create a simple colored rectangle for the player sprite
    this.createPlayerTexture();

    // Create the tile grid
    this.spawnTiles();
    
    // Create the player sprite
    this.createPlayer();
    
    // Set up input
    this.setupInput();
  }

  createPlayerTexture() {
    // Create a simple colored rectangle texture for the player
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff4444); // Red color
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('player', 16, 16);
    graphics.destroy();
  }

  spawnTiles() {
    var tile;

    // Use the same coordinate system as the interaction example
    for (var xx = 0; xx < 256; xx += 38) {
      for (var yy = 0; yy < 256; yy += 38) {
        tile = this.add.isoSprite(xx, yy, 0, 'tile', this.isoGroup);
        tile.setInteractive();

        tile.on('pointerover', function() {
          this.setTint(0x86bfda);
          this.isoZ += 5;
        });

        tile.on('pointerout', function() {
          this.clearTint();
          this.isoZ -= 5;
        });
      }
    }
  }
  
  createPlayer() {
    // Convert grid position to world coordinates
    const isoX = this.playerGridX * this.tileSize;
    const isoY = this.playerGridY * this.tileSize;
    
    this.player = this.add.isoSprite(isoX, isoY, 10, 'player', this.playerGroup);
    this.player.setScale(1.5); // Make it a bit larger
  }
  
  setupInput() {
    // Arrow keys for movement
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // WASD keys for movement
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    
    // Additional keys for rotation
    this.qe = this.input.keyboard.addKeys('Q,E');
  }
  
  update() {
    this.handleInput();
  }
  
  handleInput() {
    if (this.isMoving) return; // Prevent input during movement animation
    
    // Rotation controls
    if (Phaser.Input.Keyboard.JustDown(this.qe.Q)) {
      this.turnLeft();
    } else if (Phaser.Input.Keyboard.JustDown(this.qe.E)) {
      this.turnRight();
    }
    
    // Movement controls
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
        Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
      this.moveForward();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || 
               Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
      this.moveBackward();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || 
               Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      this.turnLeft();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || 
               Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      this.turnRight();
    }
  }
  
  turnLeft() {
    this.playerDirection = (this.playerDirection - 1 + 4) % 4;
    this.updatePlayerVisualDirection();
  }
  
  turnRight() {
    this.playerDirection = (this.playerDirection + 1) % 4;
    this.updatePlayerVisualDirection();
  }
  
  updatePlayerVisualDirection() {
    // Rotate the player sprite to show direction
    const angle = this.playerDirection * 90;
    this.tweens.add({
      targets: this.player,
      rotation: Phaser.Math.DegToRad(angle),
      duration: 200,
      ease: 'Power2'
    });
  }
  
  moveForward() {
    const newPos = this.getForwardPosition();
    if (this.isValidPosition(newPos.x, newPos.y)) {
      this.moveToPosition(newPos.x, newPos.y);
    }
  }
  
  moveBackward() {
    const newPos = this.getBackwardPosition();
    if (this.isValidPosition(newPos.x, newPos.y)) {
      this.moveToPosition(newPos.x, newPos.y);
    }
  }
  
  getForwardPosition() {
    let newX = this.playerGridX;
    let newY = this.playerGridY;
    
    switch (this.playerDirection) {
      case 0: // North
        newY -= 1;
        break;
      case 1: // East
        newX += 1;
        break;
      case 2: // South
        newY += 1;
        break;
      case 3: // West
        newX -= 1;
        break;
    }
    
    return { x: newX, y: newY };
  }
  
  getBackwardPosition() {
    let newX = this.playerGridX;
    let newY = this.playerGridY;
    
    switch (this.playerDirection) {
      case 0: // North (go South)
        newY += 1;
        break;
      case 1: // East (go West)
        newX -= 1;
        break;
      case 2: // South (go North)
        newY -= 1;
        break;
      case 3: // West (go East)
        newX += 1;
        break;
    }
    
    return { x: newX, y: newY };
  }
  
  isValidPosition(x, y) {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
  }
  
  moveToPosition(gridX, gridY) {
    this.isMoving = true;
    
    const isoX = gridX * this.tileSize;
    const isoY = gridY * this.tileSize;
    
    this.tweens.add({
      targets: this.player,
      isoX: isoX,
      isoY: isoY,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.playerGridX = gridX;
        this.playerGridY = gridY;
        this.isMoving = false;
      }
    });
  }
}

let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  parent: 'game',
  scene: IsoMoveExample,
  physics: {
    default: 'arcade'
  }
};

new Phaser.Game(config);
