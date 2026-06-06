import Phaser from 'phaser';
import { SCENE_KEYS } from '../common/scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { UserSessionData } from '../types/user-session-data.type';

export class TitleScene extends Phaser.Scene {
  #maxScore!: number;

  constructor() {
    super({
      key: SCENE_KEYS.TITLE_SCENE,
    });
  }

  init() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const userDataParsed: UserSessionData = JSON.parse(userData);
      this.#maxScore = userDataParsed.maxScore;
    } else {
      this.#maxScore = 0;
    }
  }

  create() {
    for (let i = 1; i < 4; i += 1) {
      const bgKey = ASSET_KEYS[`BACKGROUND_${i}` as keyof typeof ASSET_KEYS];
      this.add.sprite(0, 0, bgKey, 0).setOrigin(0).setAlpha(0.4).play(bgKey).setScale(1, 1.25);
    }

    this.add
      .sprite(this.scale.width / 2, this.scale.height / 2 + 40, ASSET_KEYS.PLANET, 0)
      .setScale(1.5)
      .play(ASSET_KEYS.PLANET);

    this.add
      .text(this.scale.width / 2, 100, 'PLANET DEFENSE', {
        fontSize: '32px',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 150, `MAX SCORE: ${this.#maxScore}`, {
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 200, 'CLICK TO PLAY', {
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
