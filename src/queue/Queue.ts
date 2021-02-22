import { EventEmitter } from "events";
import { delay } from "../utils/timings";
import { Job, JobStatus, IJob, Work } from './Job';
import { Ticker } from "./Ticker";

type QueueState = 'new' | 'running' | 'stopped' | 'ended';
type QueueType = 'single' | 'concurrent';
type QueueConfig = {
  concurrency?: {
    concurrentJobAmount: number;
  },
  repeat?: {
    attemptsLimit?: number;
  };
  delay?: {
    initialInterval: number;
    intervalGrowthFactor: (interval: number, attemptsMade: number) => number;
  };
}

export declare interface Queue {
  /**
   * On Job status change
   * @param event
   * @param listener
   */
  on<T>(event: JobStatus, listener: (job: IJob<T>) => void): this;
  on(event: 'start', listener: (jobsLog: Map<string, IJob<any>>) => void): this;
  on(event: 'stopped', listener: (jobsLog: Map<string, IJob<any>>) => void): this;
  on(event: 'ended', listener: (jobsLog: Map<string, IJob<any>>) => void): this;
}

export class Queue extends EventEmitter {
  public jobCounter: number;
  protected options: QueueConfig;
  protected type: QueueType;
  protected state: QueueState;
  protected activeJobs: Job[];
  protected jobsLog: Map<number, Job>;
  protected internalLoop?: Ticker<'tick'>;

  constructor(options?: QueueConfig) {
    super();

    this.jobCounter = 0;
    this.activeJobs = [];
    this.jobsLog = new Map();
    this.state = 'new';
    this.options = options || {};
    this.type = this.options.concurrency ? 'concurrent' : 'single';
  }

  add(todo: Work) {
    this.jobCounter++;
    const job = new Job(this.jobCounter, todo);
    this.activeJobs.push(job);
    this.emit(job.status, job);
  }

  stop() {
    this.state = 'stopped';
    this.emit('stopped', this.jobsLog);
    if (this.internalLoop !== undefined) {
      this.internalLoop.unsubscribe();
    }
  }

  start() {
    this.on('error', () => {});

    if (this.state === 'new') {
      this.emit('start', this.jobsLog);
      this.state = 'running';
    }
    this.internalLoop = new Ticker('tick', 1);
    this.internalLoop.on('tick', async() => {
      const job = this.activeJobs.shift();
      if (!job) {
        return;
      }
      if (job.isPending) {
        return;
      }
      await this.runJob(job);

      // if (this.type === 'concurrent' && this.options.concurrency) {
      //   const jobConcurrency = this.options.concurrency.concurrentJobAmount;

      //   await Promise.all(this.activeJobs
      //     .slice(0, jobConcurrency)
      //     .map(job => this.runJob(job))
      //   );
      //   this.activeJobs = this.activeJobs.slice(jobConcurrency);
      // } else if (this.type === 'single') {

      // }
    });
  }

  get size() {
    return this.activeJobs.length;
  }

  protected async runJob(job: Job) {
    job.setInProgess();
    if (this.options.delay && job.runAttempts) {
      const interval = this.options.delay.intervalGrowthFactor(
        this.options.delay.initialInterval,
        job.runAttempts
      );
      await delay(interval);
    }
    await job.run();
    this.emit(job.status, job);

    this.jobsLog.set(job.id, job);

    if (!this.options.repeat) {
      if (!job.isSuccess) {
        job.setAsFailed();
        this.emit(job.status, job);
      }
      return;
    } else if (!job.isSuccess && job.result instanceof Error) {
      if (job.runAttempts !== this.options.repeat.attemptsLimit) {
        this.activeJobs.unshift(job);
      } else {
        job.setAsFailed();
        this.emit(job.status, job);
      }
    }
  }
}
