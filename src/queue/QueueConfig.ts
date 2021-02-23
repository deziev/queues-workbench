export type RepeatOptions = {
  attemptsLimit?: number;
  repeatEach?: boolean;
};
export type DelayIntervalOptions = {
  beforeEach?: boolean;
  initialInterval: number;
  intervalGrowthFactor: (interval: number, attemptsMade: number) => number;
};
export type ConcurrencyOptions = {
  concurrentJobAmount: number;
};

export type QueueConfig = {
  name?: string;
  concurrency?: ConcurrencyOptions;
  repeat?: RepeatOptions;
  delay?: DelayIntervalOptions;
}