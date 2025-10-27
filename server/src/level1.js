// This file is currently not in use.
import Phaser from 'phaser';
import IsoPlugin from 'phaser3-plugin-isometric'; // This is an plugin that allows isometric view, 3d view in a 2d plane

export default class Level extends Phaser.Scene {
  constructor() {
    super({
      key: 'Level1',
      mapAdd: { isoPlugin: 'iso' } // Register the isometric plugin
    });

    this.tileSize = 38; // Size of each tile
    this.gridWidth = 7; // Number of tiles horizontally
    this.gridHeight = 7; // Number of tiles vertically
    this.goalPosition = { x: 4, y: 2 }; // Goal tile position
  }

  // Preload assets, load images and plugins
  preload() {
    this.load.image('tile', 'assets/tile.png'); // Basic tile image located in assets folder
    this.load.image('goal', 'assets/goal.png'); // Goal image located in assets folder
    // Load the isometric plugin
    this.load.scenePlugin({
      key: 'IsoPlugin',
      url: IsoPlugin,
      sceneKey: 'iso'
    });
  }

  // Create game objects, set up the scene
  create() {
    console.log('Level 1 started');
    this.isoGroup = this.add.group();
    this.playerGroup = this.add.group();
    this.goalGroup = this.add.group();

    this.iso.projector.origin.setTo(0.5, 0.3); // Set the origin for isometric projection

    this.createPlayerTexture();
    this.createGoalTexture();

    this.spawnTiles();
    this.createGoal();
    this.createPlayer();

    this.playerGridX = 2;
    this.playerGridY = 2;
    this.playerDirection = 1; // Facing east

    this.isMoving = false;

    // Text label for instructions
    this.instructionText = this.add.text(10, 10, 'Move forward to reach the goal!', {
      fontSize: '18px',
      color: '#ffffff'
    }).setScrollFactor(0);

    this.winText = this.add.text(200, 10, '', {
      fontSize: '18px',
      color: '#00ff00'
    }).setScrollFactor(0);

    // Input keys for testing (optional)
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  // This function is called every frame
  update() {
    // For testing purposes, use right arrow key to move forward
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.moveForward();
    }
  }

  // Create a simple red square texture for the player
  createPlayerTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff4444);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('player', 16, 16);
    graphics.destroy();
  }

  // Create a simple green square texture for the goal
  createGoalTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x44ff44);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('goal', 16, 16);
    graphics.destroy();
  }

  // Spawn the isometric tiles to form the grid
  spawnTiles() {
    let tile;
    for (let xx = 0; xx < 256; xx += this.tileSize) {
      for (let yy = 0; yy < 256; yy += this.tileSize) {
        tile = this.add.isoSprite(xx, yy, 0, 'tile', this.isoGroup);
        tile.setInteractive();
      }
    }
  }

  // Create the player sprite at the starting position
  createPlayer() {
    const isoX = 2 * this.tileSize;
    const isoY = 2 * this.tileSize;
    this.player = this.add.isoSprite(isoX, isoY, 10, 'player', this.playerGroup);
    this.player.setScale(1.5);
  }

  // Create the goal sprite at the goal position
  createGoal() {
    const isoX = this.goalPosition.x * this.tileSize;
    const isoY = this.goalPosition.y * this.tileSize;
    this.goal = this.add.isoSprite(isoX, isoY, 5, 'goal', this.goalGroup);
    this.goal.setScale(1.5);
  }

  // Move the player one tile forward in the current direction
  moveForward() {
    if (this.isMoving) return;
    this.isMoving = true;

    const newX = this.playerGridX + 1; // move one step east
    const newY = this.playerGridY;

    const isoX = newX * this.tileSize;
    const isoY = newY * this.tileSize;

    this.tweens.add({
      targets: this.player,
      isoX: isoX,
      isoY: isoY,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.playerGridX = newX;
        this.playerGridY = newY;
        this.isMoving = false;
        this.checkGoalReached();
      }
    });
  }

  // Check if the player has reached the goal position
  checkGoalReached() {
    if (
      this.playerGridX === this.goalPosition.x &&
      this.playerGridY === this.goalPosition.y
    ) {
      this.winText.setText('✅ Level Complete!');
      this.instructionText.setText('');
      this.player.setTint(0x44ff44);
      this.isMoving = true; // Stop further input
    }
  }
}