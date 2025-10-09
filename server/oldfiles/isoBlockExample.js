import Phaser, { Game, Scene } from 'phaser';
import IsoPlugin from 'phaser3-plugin-isometric';

class IsoGridMovement extends Scene {
  constructor() {
    const sceneConfig = {
      key: 'IsoGridMovement',
      mapAdd: { isoPlugin: 'iso' }
    };
    super(sceneConfig);
    
    // Grid settings
    this.gridSize = 64; // Size of each grid block
    this.gridWidth = 8; // Number of blocks wide
    this.gridHeight = 8; // Number of blocks tall
    
    // Player state
    this.playerGridX = 4; // Starting grid position
    this.playerGridY = 4;
    this.playerDirection = 0; // 0=North, 1=East, 2=South, 3=West
    this.isMoving = false; // Prevent input during movement
    
    // Direction vectors for movement (isometric coordinates)
    this.directionVectors = [
      { x: 0, y: -1 }, // North (forward in iso Y)
      { x: 1, y: 0 },  // East (forward in iso X)  
      { x: 0, y: 1 },  // South (backward in iso Y)
      { x: -1, y: 0 }  // West (backward in iso X)
    ];
  }

  preload() {
    // Create simple colored rectangles as textures
    this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    // Load the isometric plugin
    this.load.scenePlugin({
      key: 'IsoPlugin',
      url: IsoPlugin,
      sceneKey: 'iso'
    });
  }

  create() {
    // Set the isometric projection origin
    this.iso.projector.origin.setTo(0.5, 0.3);
    
    // Create the grid
    this.createGrid();
    
    // Create the player sprite
    this.createPlayer();
    
    // Setup input
    this.setupInput();
    
    // Add instructions
    this.addInstructions();
  }
  
  createGrid() {
    this.gridTiles = [];
    
    for (let x = 0; x < this.gridWidth; x++) {
      this.gridTiles[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        // Calculate isometric position
        const isoX = x * this.gridSize;
        const isoY = y * this.gridSize;
        
        // Create ground tile
        const tile = this.add.isoSprite(isoX, isoY, 0, 'ground');
        
        // Make it look like a ground tile (gray with border)
        tile.setTint(0x888888);
        tile.setDisplaySize(this.gridSize, this.gridSize);
        tile.setInteractive();
        
        // Add hover effect for visual feedback
        tile.on('pointerover', () => {
          if (!this.isMoving) {
            tile.setTint(0xaaaaaa);
          }
        });
        
        tile.on('pointerout', () => {
          tile.setTint(0x888888);
        });
        
        this.gridTiles[x][y] = tile;
      }
    }
  }
  
  createPlayer() {
    // Calculate initial isometric position
    const isoX = this.playerGridX * this.gridSize;
    const isoY = this.playerGridY * this.gridSize;
    const isoZ = 32; // Slightly elevated above ground
    
    // Create player sprite
    this.player = this.add.isoSprite(isoX, isoY, isoZ, 'player');
    this.player.setTint(0xff4444); // Red color
    this.player.setDisplaySize(this.gridSize * 0.8, this.gridSize * 0.8);
    
    // Add direction indicator (a small triangle pointing forward)
    this.directionIndicator = this.add.isoSprite(isoX, isoY, isoZ + 20, 'player');
    this.directionIndicator.setTint(0xffff44); // Yellow color
    this.directionIndicator.setDisplaySize(this.gridSize * 0.3, this.gridSize * 0.3);
    
    this.updateDirectionIndicator();
  }
  
  setupInput() {
    // Create cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add WASD keys
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    
    // Add spacebar for forward movement
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }
  
  update() {
    if (this.isMoving) return; // Ignore input during movement
    
    // Handle turning (A/D or Left/Right arrows)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || 
        Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      this.turnLeft();
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || 
        Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      this.turnRight();
    }
    
    // Handle forward movement (W, Up arrow, or Spacebar)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
        Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.moveForward();
    }
  }
  
  turnLeft() {
    this.playerDirection = (this.playerDirection - 1 + 4) % 4;
    this.updateDirectionIndicator();
    
    // Add a small rotation animation to the player
    this.tweens.add({
      targets: this.player,
      angle: this.player.angle - 15,
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    });
  }
  
  turnRight() {
    this.playerDirection = (this.playerDirection + 1) % 4;
    this.updateDirectionIndicator();
    
    // Add a small rotation animation to the player
    this.tweens.add({
      targets: this.player,
      angle: this.player.angle + 15,
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    });
  }
  
  moveForward() {
    // Calculate target grid position
    const direction = this.directionVectors[this.playerDirection];
    const targetGridX = this.playerGridX + direction.x;
    const targetGridY = this.playerGridY + direction.y;
    
    // Check if target position is within bounds
    if (targetGridX < 0 || targetGridX >= this.gridWidth || 
        targetGridY < 0 || targetGridY >= this.gridHeight) {
      // Can't move outside grid - maybe add a bounce effect
      this.bouncePlayer();
      return;
    }
    
    // Update player grid position
    this.playerGridX = targetGridX;
    this.playerGridY = targetGridY;
    
    // Calculate target isometric position
    const targetIsoX = targetGridX * this.gridSize;
    const targetIsoY = targetGridY * this.gridSize;
    
    // Start movement animation
    this.isMoving = true;
    
    // Animate player movement
    this.tweens.add({
      targets: this.player,
      isoX: targetIsoX,
      isoY: targetIsoY,
      isoZ: this.player.isoZ + 10, // Small hop during movement
      duration: 200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Lower the player back down
        this.tweens.add({
          targets: this.player,
          isoZ: this.player.isoZ - 10,
          duration: 100,
          ease: 'Power2.easeIn',
          onComplete: () => {
            this.isMoving = false;
          }
        });
      }
    });
    
    // Animate direction indicator
    this.tweens.add({
      targets: this.directionIndicator,
      isoX: targetIsoX,
      isoY: targetIsoY,
      duration: 200,
      ease: 'Power2.easeOut'
    });
  }
  
  bouncePlayer() {
    // Small bounce animation when hitting boundary
    const direction = this.directionVectors[this.playerDirection];
    const bounceDistance = 10;
    
    this.tweens.add({
      targets: [this.player, this.directionIndicator],
      isoX: this.player.isoX + (direction.x * bounceDistance),
      isoY: this.player.isoY + (direction.y * bounceDistance),
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }
  
  updateDirectionIndicator() {
    // Position the direction indicator in front of the player
    const direction = this.directionVectors[this.playerDirection];
    const offset = this.gridSize * 0.3;
    
    this.directionIndicator.isoX = this.player.isoX + (direction.x * offset);
    this.directionIndicator.isoY = this.player.isoY + (direction.y * offset);
  }
  
  addInstructions() {
    const instructions = [
      'Isometric Grid Movement:',
      'W/↑/SPACE - Move Forward',
      'A/← - Turn Left (90°)',
      'D/→ - Turn Right (90°)',
      '',
      'Red square: Player',
      'Yellow dot: Direction indicator'
    ];
    
    this.add.text(16, 16, instructions.join('\n'), {
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 700,
  backgroundColor: '#2c3e50',
  pixelArt: true,
  scene: IsoGridMovement
};

// Start the game
new Game(config);