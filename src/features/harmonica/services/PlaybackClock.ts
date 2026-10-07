export class PlaybackClock {
  private startedAt: number | null = null;
  private pausedAt = 0;

  constructor(private duration: number) {}

  setDuration(duration: number) {
    this.duration = duration;
  }

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

  positionAt(now: number) {
    if (this.startedAt === null) return this.pausedAt;
    return Math.min(this.pausedAt + (now - this.startedAt) / 1000, this.duration);
  }

  hasEnded(now: number) {
    return this.positionAt(now) >= this.duration;
  }
}
