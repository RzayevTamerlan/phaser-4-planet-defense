import Phaser from 'phaser';

export class InputController {
  readonly #cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  #locked = false;

  constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) {
      throw new Error('Keyboard plugin is not available on this scene.');
    }
    this.#cursors = scene.input.keyboard.createCursorKeys();
  }

  get locked(): boolean {
    return this.#locked;
  }

  lock(): void {
    this.#locked = true;
  }

  rotateDirection(): -1 | 0 | 1 {
    if (this.#locked) return 0;
    if (this.#cursors.left.isDown) return -1;
    if (this.#cursors.right.isDown) return 1;
    return 0;
  }

  fireJustPressed(): boolean {
    if (this.#locked) return false;
    return Phaser.Input.Keyboard.JustDown(this.#cursors.space);
  }
}
