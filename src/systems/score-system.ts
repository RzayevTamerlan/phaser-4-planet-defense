import { ScoreDisplay } from '../ui/score-display';

export class ScoreSystem {
  readonly #display: ScoreDisplay;
  #score = 0;

  constructor(display: ScoreDisplay) {
    this.#display = display;
    this.#display.setValue(0);
  }

  get value(): number {
    return this.#score;
  }

  add(n: number): void {
    this.#score += n;
    this.#display.setValue(this.#score);
  }
}
