import Phaser from 'phaser';

export class ScoreDisplay extends Phaser.GameObjects.Container {
  readonly #valueText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const prefix = scene.add.text(0, 0, 'SCORE: ', { fontSize: '16px' });
    this.#valueText = scene.add.text(prefix.displayWidth, 0, '0', { fontSize: '16px' });
    this.add([prefix, this.#valueText]);
    this.setDepth(2);
    scene.add.existing(this);
  }

  setValue(value: number): void {
    this.#valueText.setText(value.toString(10));
  }
}
