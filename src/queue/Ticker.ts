import { EventEmitter } from 'events';

export declare interface Ticker<E extends string> {
  on(event: E, listener: Function): this;
}

export class Ticker<E extends string> extends EventEmitter {
  private readonly interval: NodeJS.Timeout;

  constructor(name: E, timeout: number = 1000) {
    super();

    this.interval = setInterval(async () => {
      this.emit(name, () => { return; });
    }, timeout);
  }

  unsubscribe() {
    clearInterval(this.interval);
  }
}