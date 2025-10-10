import Phaser from 'phaser';
import IsoPlugin from 'phaser3-plugin-isometric';

export default class Level extends Phaser.Scene {
  constructor() {
    super({
      key: 'Level1',
      mapAdd: { isoPlugin: 'iso' }
    });

    this.tileSize = 38;
    this.gridWidth = 7;
    this.gridHeight = 7;
    this.goalPosition = { x: 4, y: 2 };
  }

  preload() {
    this.load.image('tile', 'assets/tile.png');
    this.load.image('goal', 'assets/goal.png'); // Add a small green tile
    this.load.scenePlugin({
      key: 'IsoPlugin',
      url: IsoPlugin,
      sceneKey: 'iso'
    });
  }

  create() {
    console.log('Level 1 started');
    this.isoGroup = this.add.group();
    this.playerGroup = this.add.group();
    this.goalGroup = this.add.group();

    this.iso.projector.origin.setTo(0.5, 0.3);

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

  update() {
    // Basic keyboard testing — optional
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.moveForward();
    }
  }

  createPlayerTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff4444);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('player', 16, 16);
    graphics.destroy();
  }

  createGoalTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x44ff44);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('goal', 16, 16);
    graphics.destroy();
  }

  spawnTiles() {
    let tile;
    for (let xx = 0; xx < 256; xx += this.tileSize) {
      for (let yy = 0; yy < 256; yy += this.tileSize) {
        tile = this.add.isoSprite(xx, yy, 0, 'tile', this.isoGroup);
        tile.setInteractive();
      }
    }
  }

  createPlayer() {
    const isoX = 2 * this.tileSize;
    const isoY = 2 * this.tileSize;
    this.player = this.add.isoSprite(isoX, isoY, 10, 'player', this.playerGroup);
    this.player.setScale(1.5);
  }

  createGoal() {
    const isoX = this.goalPosition.x * this.tileSize;
    const isoY = this.goalPosition.y * this.tileSize;
    this.goal = this.add.isoSprite(isoX, isoY, 5, 'goal', this.goalGroup);
    this.goal.setScale(1.5);
  }

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