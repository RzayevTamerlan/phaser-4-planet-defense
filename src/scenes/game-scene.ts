import Phaser from 'phaser';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/assets.js';
import { GameOverSceneData } from '../types/game-over-scene-data.type';
import { Planet } from '../entities/planet';
import { Player } from '../entities/player';
import { ScoreDisplay } from '../ui/score-display';
import { HealthDisplay } from '../ui/health-display';
import { InputController } from '../systems/input-controller';
import { AudioSystem } from '../systems/audio-system';
import { BulletPool } from '../systems/bullet-pool';
import { ExplosionPool } from '../systems/explosion-pool';
import { EnemySpawner } from '../systems/enemy-spawner';
import { ScoreSystem } from '../systems/score-system';
import { CollisionSystem } from '../systems/collision-system';

const PLAYER_ROTATION_PER_FRAME = 0.03;
const HEALTH_DISPLAY_Y_OFFSET = 50;
const FADE_OUT_DURATION_MS = 750;

export class GameScene extends Phaser.Scene {
  #planet!: Planet;
  #player!: Player;
  #input!: InputController;
  #bullets!: BulletPool;
  #explosions!: ExplosionPool;
  #score!: ScoreSystem;

  constructor() {
    super({ key: SCENE_KEYS.GAME_SCENE });
  }

  create(): void {
    this.#createBackground();

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    this.#planet = new Planet(this, centerX, centerY);
    this.#player = new Player(this, centerX, centerY, this.#planet.displayHeight / 2);

    this.#input = new InputController(this);
    const audio = new AudioSystem(this);
    this.#bullets = new BulletPool(this, audio);
    this.#explosions = new ExplosionPool(this, audio);
    const enemies = new EnemySpawner(this, centerX, centerY);
    enemies.start();

    const scoreDisplay = new ScoreDisplay(this, 10, 10);
    const healthDisplay = new HealthDisplay(
      this,
      centerX,
      this.#planet.y + HEALTH_DISPLAY_Y_OFFSET,
      this.#planet.maxHealth
    );
    this.#score = new ScoreSystem(scoreDisplay);

    new CollisionSystem(this, {
      planet: this.#planet,
      bullets: this.#bullets,
      enemies,
      explosions: this.#explosions,
      score: this.#score,
      audio,
      health: healthDisplay,
      onPlanetDestroyed: () => this.#endGame(),
    });
  }

  update(time: number): void {
    if (this.#input.locked) return;
    const direction = this.#input.rotateDirection();
    if (direction !== 0) {
      this.#player.rotateBy(direction * PLAYER_ROTATION_PER_FRAME);
    }
    if (this.#input.fireJustPressed()) {
      this.#bullets.fireFrom(this.#player, time);
    }
  }

  #createBackground(): void {
    for (let i = 1; i < 4; i += 1) {
      const bgKey = ASSET_KEYS[`BACKGROUND_${i}` as keyof typeof ASSET_KEYS];
      this.add.sprite(0, 0, bgKey, 0).setOrigin(0).setAlpha(0.4).play(bgKey).setScale(1, 1.25);
    }
  }

  #endGame(): void {
    this.#input.lock();
    this.#player.setVisible(false);
    this.#explosions.play(this.#planet.x, this.#planet.y);
    this.#planet.hide();
    this.cameras.main.fadeOut(FADE_OUT_DURATION_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.GAME_OVER_SCENE, {
        score: this.#score.value,
      } satisfies GameOverSceneData);
    });
  }
}
