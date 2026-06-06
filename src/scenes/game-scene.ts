import Phaser from 'phaser';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/assets.js';
import { PhaserBody } from '../types/phaser-body.type';
import { GameOverSceneData } from '../types/game-over-scene-data.type';

const DATA_KEYS = Object.freeze({
  ROTATION_SPEED: 'ROTATION_SPEED',
});

export class GameScene extends Phaser.Scene {
  #planet!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  #player!: Phaser.GameObjects.Image;
  #playerAngle!: number;
  #cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  #bulletGroup!: Phaser.Physics.Arcade.Group;
  #lastBulletFiredTime!: number;
  #enemyGroup!: Phaser.Physics.Arcade.Group;
  #enemySpeed!: number;
  #spawnDelay!: number;
  #spawnTimer!: Phaser.Time.TimerEvent;
  #destroyedEnemyGroup!: Phaser.Physics.Arcade.Group;
  #score!: number;
  #scoreText!: Phaser.GameObjects.Text;
  #planetHealth!: number;
  #lockInput!: boolean;
  #planetHealthContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({
      key: SCENE_KEYS.GAME_SCENE,
    });
  }

  create(): void {
    if (!this.input.keyboard) {
      return;
    }

    // create game background
    for (let i = 1; i < 4; i += 1) {
      const bgKey = ASSET_KEYS[`BACKGROUND_${i}` as keyof typeof ASSET_KEYS];
      this.add.sprite(0, 0, bgKey, 0).setOrigin(0).setAlpha(0.4).play(bgKey).setScale(1, 1.25);
    }

    // create planet to defend
    this.#planet = this.physics.add
      .sprite(this.scale.width / 2, this.scale.height / 2, ASSET_KEYS.PLANET, 0)
      .play(ASSET_KEYS.PLANET);
    this.#planet.body.setCircle(30, 18, 18);

    // create player ship
    this.#player = this.add.image(0, 0, ASSET_KEYS.SHIP, 0).setScale(1);
    this.#playerAngle = 0;
    this.#updatePlayerPosition();

    // create players weapon
    this.#bulletGroup = this.physics.add.group([]);
    this.#destroyedEnemyGroup = this.physics.add.group([]);

    this.#lastBulletFiredTime = 0;

    this.#enemyGroup = this.physics.add.group([]);

    this.#spawnDelay = 1250;
    this.#enemySpeed = 40;

    this.#spawnTimer = this.time.addEvent({
      delay: this.#spawnDelay,
      callback: this.#spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    this.time.addEvent({
      delay: 12000,
      callbackScope: this,
      callback: this.#increaseDifficulty,
      loop: true,
    });

    this.physics.add.overlap(
      this.#bulletGroup,
      this.#enemyGroup,
      this.#handleBulletAndEnemyCollision,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.#planet,
      this.#enemyGroup,
      this.#handlePlanetAndEnemyCollision,
      undefined,
      this
    );
    this.#score = 0;
    const scoreTextPrefix = this.add.text(10, 10, 'SCORE: ', { fontSize: '16px' }).setDepth(2);
    this.#scoreText = this.add
      .text(scoreTextPrefix.x + scoreTextPrefix.displayWidth, scoreTextPrefix.y, '0', {
        fontSize: '16px',
      })
      .setDepth(2);
    this.#planetHealth = 3;
    this.#planetHealthContainer = this.add.container(this.scale.width / 2, this.#planet.y + 50, [
      this.add.sprite(-18, 0, ASSET_KEYS.HEART, 0).play(ASSET_KEYS.HEART),
      this.add.sprite(0, 0, ASSET_KEYS.HEART, 0).play(ASSET_KEYS.HEART),
      this.add.sprite(18, 0, ASSET_KEYS.HEART, 0).play(ASSET_KEYS.HEART),
    ]);

    // create input
    this.#cursorKeys = this.input.keyboard.createCursorKeys();
    this.#lockInput = false;
  }

  update(time: number): void {
    if (this.#lockInput) {
      return;
    }
    // Rotate player around Earth
    if (this.#cursorKeys.left.isDown) {
      this.#playerAngle -= 0.03;
    } else if (this.#cursorKeys.right.isDown) {
      this.#playerAngle += 0.03;
    }
    this.#updatePlayerPosition();

    // Fire bullet with spacebar
    if (
      Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space) &&
      time > this.#lastBulletFiredTime + 200
    ) {
      this.#fireBullet();
      this.#lastBulletFiredTime = time;
    }

    // Clean up bullets that go off screen
    const bullets = this.#bulletGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
    bullets.forEach((bullet) => {
      if (
        bullet.active &&
        (bullet.x < 0 ||
          bullet.x > this.scale.width ||
          bullet.y < 0 ||
          bullet.y > this.scale.height)
      ) {
        bullet.setActive(false).setVisible(false);
      }
    });

    const enemies = this.#enemyGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
    enemies.forEach((enemy) => {
      if (
        enemy.active &&
        (enemy.x < -50 ||
          enemy.x > this.scale.width + 50 ||
          enemy.y < -50 ||
          enemy.y > this.scale.height + 50)
      ) {
        enemy.setActive(false).setVisible(false);
        return;
      }

      enemy.rotation += enemy.getData(DATA_KEYS.ROTATION_SPEED);
    });
  }

  #updatePlayerPosition(): void {
    // Use polar coordinates to position player
    const x = this.scale.width / 2 + (this.#planet.displayHeight / 2) * Math.cos(this.#playerAngle);
    const y =
      this.scale.height / 2 + (this.#planet.displayHeight / 2) * Math.sin(this.#playerAngle);
    this.#player.setPosition(x, y);
    this.#player.rotation = this.#playerAngle + Math.PI / 2; // Rotate to face outward
  }

  #fireBullet(): void {
    // Create bullet from player's current position
    const x = this.#player.x;
    const y = this.#player.y;
    const velocity = this.physics.velocityFromRotation(this.#playerAngle, 400); // Shoot outward
    const bullet = this.#bulletGroup.getFirstDead(
      true,
      x,
      y,
      ASSET_KEYS.BULLET,
      0,
      true
    ) as Phaser.Physics.Arcade.Sprite;
    bullet
      .setActive(true)
      .setVisible(true)
      .play(ASSET_KEYS.BULLET, true)
      .setScale(1.5)
      .enableBody();
    bullet.setVelocity(velocity.x, velocity.y);
    bullet.setRotation(this.#player.rotation);
    this.sound.play(ASSET_KEYS.FX_SHOT, {
      volume: 0.3,
    });
  }

  #spawnEnemy(): void {
    let x: number, y: number;

    const edge = Phaser.Math.Between(0, 3);
    if (edge === 0) {
      x = 0;
      y = Phaser.Math.Between(0, this.scale.height);
    } else if (edge === 1) {
      x = this.scale.width;
      y = Phaser.Math.Between(0, this.scale.height);
    } else if (edge === 2) {
      y = 0;
      x = Phaser.Math.Between(0, this.scale.width);
    } else {
      x = Phaser.Math.Between(0, this.scale.width);
      y = this.scale.height;
    }

    const enemy = this.#enemyGroup.getFirstDead(
      true,
      x,
      y,
      ASSET_KEYS.ASTEROID,
      0,
      true
    ) as Phaser.Physics.Arcade.Sprite;

    enemy
      .setActive(true)
      .setVisible(true)
      .enableBody()
      .play(ASSET_KEYS.ASTEROID, true)
      .setScale(Phaser.Math.FloatBetween(0.75, 1.25))
      .setData(DATA_KEYS.ROTATION_SPEED, Phaser.Math.FloatBetween(-0.04, 0.04));

    this.physics.moveTo(enemy, this.scale.width / 2, this.scale.height / 2, this.#enemySpeed);
    enemy.body?.setSize(enemy.displayWidth * 0.3, enemy.displayHeight * 0.3, true);
  }

  #increaseDifficulty(): void {
    if (this.#spawnDelay > 500) {
      this.#spawnDelay -= 25;
      this.#spawnTimer.destroy();
      this.#spawnTimer = this.time.addEvent({
        delay: this.#spawnDelay,
        callback: this.#spawnEnemy,
        callbackScope: this,
        loop: true,
      });
    }
    if (this.#enemySpeed < 200) {
      this.#enemySpeed += 5;
    }
  }

  #handleBulletAndEnemyCollision(bullet: PhaserBody, enemy: PhaserBody): void {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;

    bulletSprite.disableBody().setActive(false).setVisible(false);
    enemySprite.disableBody().setActive(false).setVisible(false);

    this.#score += 1;
    this.#scoreText.setText(this.#score.toString(10));

    this.#spawnDestroyedEnemy(enemySprite.x, enemySprite.y);
  }

  #spawnDestroyedEnemy(x: number, y: number): void {
    const explosion = this.#destroyedEnemyGroup.getFirstDead(
      true,
      x,
      y,
      ASSET_KEYS.ASTEROID_EXPLODE,
      0,
      true
    );

    explosion.setActive(true).setVisible(true).play(ASSET_KEYS.ASTEROID_EXPLODE);
    explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      explosion.setActive(false).setVisible(false);
    });
    this.sound.play(ASSET_KEYS.FX_EXPLOSION, {
      volume: 0.3,
    });
  }

  #handlePlanetAndEnemyCollision(_planet: PhaserBody, enemy: PhaserBody): void {
    // const planetSprite = planet as Phaser.Physics.Arcade.Sprite;
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
    enemySprite.disableBody().setActive(false).setVisible(false);
    this.#spawnDestroyedEnemy(enemySprite.x, enemySprite.y);
    this.#damagePlanet();
  }

  #damagePlanet(): void {
    if (this.#planetHealth === 0) {
      this.cameras.main.shake(200, 0.03);
      this.tweens.add({
        targets: this.#planet,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 200,
        ease: Phaser.Math.Easing.Quadratic.InOut,
        yoyo: true,
      });
    }

    this.#planetHealth -= 1;
    this.sound.play(ASSET_KEYS.FX_HIT, {
      volume: 0.4,
    });
    this.#planetHealthContainer.getAt(this.#planetHealth)?.destroy();

    if (this.#planetHealth <= 0) {
      this.#lockInput = true;
      this.#player.setVisible(false);
      this.#planet.disableBody().setActive(false).setVisible(false);
      this.#spawnDestroyedEnemy(this.#planet.x, this.#planet.y);
      this.cameras.main.fadeOut(750);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENE_KEYS.GAME_OVER_SCENE, {
          score: this.#score,
        } satisfies GameOverSceneData);
      });
      return;
    }

    this.cameras.main.shake(200, 0.03);
    this.tweens.add({
      targets: this.#planet,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 200,
      ease: Phaser.Math.Easing.Quadratic.InOut,
      yoyo: true,
    });
  }
}
