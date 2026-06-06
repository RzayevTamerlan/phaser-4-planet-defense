import Phaser from 'phaser';
import { SCENE_KEYS } from '../common/scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { GameOverSceneData } from '../types/game-over-scene-data.type';
import { UserSessionData } from '../types/user-session-data.type';

export class GameOverScene extends Phaser.Scene {
  #score!: number;
  #maxScore!: number;

  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER_SCENE,
    });
  }

  init(data: GameOverSceneData) {
    const userCurrentSessionScore = data.score;
    this.#score = data.score;

    const userData = localStorage.getItem('userData');
    if (userData) {
      const userDataParsed: UserSessionData = JSON.parse(userData);
      const userMaxScore = userDataParsed.maxScore;

      if (userMaxScore > userCurrentSessionScore) {
        this.#maxScore = userMaxScore;
      } else {
        const newUserData = JSON.stringify({
          maxScore: userCurrentSessionScore,
        } satisfies UserSessionData);
        localStorage.setItem('userData', newUserData);
        this.#maxScore = userCurrentSessionScore;
      }
    } else {
      this.#maxScore = userCurrentSessionScore;
      const newUserData = JSON.stringify({
        maxScore: userCurrentSessionScore,
      } satisfies UserSessionData);
      localStorage.setItem('userData', newUserData);
    }
  }

  create() {
    for (let i = 1; i < 4; i += 1) {
      const bgKey = ASSET_KEYS[`BACKGROUND_${i}` as keyof typeof ASSET_KEYS];
      this.add.sprite(0, 0, bgKey, 0).setOrigin(0).setAlpha(0.4).play(bgKey).setScale(1, 1.25);
    }

    this.add
      .text(this.scale.width / 2, 100, 'GAME OVER', {
        fontSize: '32px',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 150, `SCORE: ${this.#score}`, {
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 200, `MAX SCORE: ${this.#maxScore}`, {
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 300, 'Click to play again', {
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENE_KEYS.GAME_SCENE);
      });
    });
  }
}
