export class Timer {
  private startTime: number | undefined;
  private returnType: ReturnType<typeof setInterval> | undefined;
  private elapsedTime: number;
  private isPaused: boolean;

  constructor() {
    this.startTime = undefined;
    this.returnType = undefined;
    this.elapsedTime = 0;
    this.isPaused = false;
  }

  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public start(): void {
    if (this.isPaused) {
      const currentTime = Date.now();
      this.startTime = currentTime - this.elapsedTime;
      this.isPaused = false;
      this.returnType = setInterval(() => {
        this.tick();
      }, 100);
    } else {
      this.startTime = Date.now();
      this.isPaused = false;
      this.returnType = setInterval(() => {
        this.tick();
      }, 100);
    }
  }

  private tick(): void {
    this.elapsedTime = this.startTime !== undefined ? Date.now() - this.startTime : 0;
  }

  public isStarted(): boolean {
    return this.startTime !== undefined;
  }

  public stop(): void {
    if (this.returnType) {
      clearInterval(this.returnType);
    }
  }

  public reset(): void {
    if (this.returnType) {
      clearInterval(this.returnType);
    }
    this.returnType = undefined;
    this.startTime = undefined;
    this.elapsedTime = 0;
    this.isPaused = false;
  }

  public togglePause(): void {
    if (this.isPaused) {
      this.start();
    } else {
      if (this.returnType) {
        clearInterval(this.returnType);
      }
      this.isPaused = true;
    }
  }
}
