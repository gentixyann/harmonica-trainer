export class PlaybackClock {
  private startedAt: number | null = null;
  private pausedAt = 0;
  private speed = 1;

  constructor(private readonly duration: number) {}

  play(now: number) {
    this.startedAt = now;
  }

  pause(now: number) {
    this.pausedAt = this.positionAt(now);
    this.startedAt = null;
  }

  reset() {
    this.startedAt = null;
    this.pausedAt = 0;
  }

  setSpeed(speed: number, now: number) {
    this.pausedAt = this.positionAt(now);
    if (this.startedAt !== null) this.startedAt = now;
    this.speed = speed;
  }

  positionAt(now: number) {
    if (this.startedAt === null) return this.pausedAt;
    return Math.min(this.pausedAt + (now - this.startedAt) / 1000 * this.speed, this.duration);
  }

  hasEnded(now: number) {
    return this.positionAt(now) >= this.duration;
  }
}
