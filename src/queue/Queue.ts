import { EventEmitter } from "events";
import { delay } from "../utils/timings";
import { uid } from "../utils/uid";

import { Ticker } from "./Ticker";
import { Job, JobStatus, IJob, Work } from './Job';
import { QueueConfig, RepeatOptions, DelayIntervalOptions } from './QueueConfig';

type QueueState = 'new' | 'running' | 'stopped' | 'ended';
type QueueType = 'single' | 'concurrent';

type QueueStateEvents = 'start' | 'stopped' | 'ended';
type QueueJobEvents = JobStatus | 'job-status-change';

export declare interface Queue {
  /**
   * On Job status change
   * @param event
   * @param listener
   */
  on<T>(event: QueueJobEvents, listener: (job: IJob<T>) => void): this;
  /**
   * On Queue state changes
   * @param event
   * @param listener
   */
  on(event: QueueStateEvents, listener: (jobsLog: Map<number, IJob<any>>) => void): this;

  emit(event: QueueJobEvents, job: Job): boolean;
  emit(event: QueueStateEvents, jobsLog: Map<number, IJob<any>>): boolean;
}

export class Queue extends EventEmitter {
  public readonly name: string;
  public jobCounter: number;
  protected options: QueueConfig;
  protected type: QueueType;
  protected state: QueueState;
  protected activeJobs: Job[];
  protected jobsLog: Map<number, Job>;
  protected internalLoop?: Ticker<'tick'>;

  constructor(options?: QueueConfig) {
    super();
    this.name = (options && options.name) ? options.name : `queue:${uid()}`;
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
    this.emitJobStatusChange(job);
  }

  stop() {
    this.state = 'stopped';
    if (this.internalLoop !== undefined) {
      this.internalLoop.unsubscribe();
    }
    this.emit('stopped', this.jobsLog);
  }

  start() {
    this.on('error', () => {});

    if (this.state === 'new') {
      this.state = 'running';
      this.emit('start', this.jobsLog);
    }
    this.internalLoop = new Ticker('tick', 1);
    this.internalLoop.on('tick', async() => {
      if (this.type === 'concurrent' && this.options.concurrency) {
        const jobConcurrency = this.options.concurrency.concurrentJobAmount;
        const concurrentJobsList = this.activeJobs
          .filter(job => !job.isPending)
          .slice(0, jobConcurrency);

        if (!concurrentJobsList.length) {
          return;
        }

        await Promise.all(concurrentJobsList
          .map(job => this.runJob(job))
        );

        this.activeJobs = this.activeJobs.filter(job => !job.isDone);

      } else if (this.type === 'single') {
        const job = this.activeJobs.shift();
        if (!job) {
          return;
        }
        if (job.isPending) {
          return;
        }
        await this.runJob(job);
      }
    });
  }

  get size() {
    return this.activeJobs.length;
  }

  get activeJobsIdList() {
    return this.activeJobs.map(job => job.id);
  }

  protected async runJob(job: Job): Promise<Job> {
    job.setInProgess();
    if (this.options.delay && job.runAttempts) {
      await this.delayJob(job, this.options.delay);
    }
    await job.run();
    this.emitJobStatusChange(job);

    this.jobsLog.set(job.id, job);

    if (!this.options.repeat) {
      if (!job.isSuccess) {
        this.failJob(job);
      }
      return job;
    } else if (!job.isSuccess && job.result instanceof Error) {
      this.rescheduleOrFailJob(job, this.options.repeat);
    }
    return job;
  }

  protected async delayJob(job: Job, delayOptions: DelayIntervalOptions) {
    const interval = delayOptions.intervalGrowthFactor(
      delayOptions.initialInterval,
      job.runAttempts
    );
    await delay(interval);
  }

  protected rescheduleOrFailJob(job: Job, rescheduleOptions: RepeatOptions) {
    if (job.runAttempts !== rescheduleOptions.attemptsLimit) {
      if (!this.activeJobs.find(activeJob => activeJob.id === job.id)) {
        this.activeJobs.unshift(job);
      }
    } else {
      this.failJob(job);
    }
  }

  protected failJob(job: Job) {
    job.setAsFailed();
    this.emitJobStatusChange(job);
  }

  protected emitJobStatusChange(job: Job) {
    this.emit(job.status, job);
    this.emit('job-status-change', job);
  }

  protected get errorJobs() {
    const errorJobList: Job[] = [];
    for (let [key] of this.jobsLog) {
      const job = this.jobsLog.get(key);
      if (job && job.isError) {
        errorJobList.push(this.jobsLog.get(key)!);
      }
    }
    return errorJobList;
  }
}
