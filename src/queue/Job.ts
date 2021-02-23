export type JobStatus = 'new' | 'success' | 'error' | 'pending' | 'failed';
export type Work = (job: Job) => Promise<any>;

export interface IJob<T> {
  id: number;
  runAttempts: number;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  result: T;
}

export class Job implements IJob<undefined | any | Error> {
  public readonly id: number;
  public readonly createdAt: number;
  public runAttempts: number;
  public status: JobStatus;
  public updatedAt: number;

  protected work: Work;
  public result: undefined | any | Error;

  constructor(id: number, work: Work) {
    this.id = id;
    this.work = work;
    this.status = 'new';
    this.runAttempts = 0;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  async run() {
    this.status = 'pending';
    try {
      const result = await this.work(this);
      this.result = result;
      this.status = 'success';
    } catch (error) {
      this.result = error;
      this.status = 'error';
    }
    this.updatedAt = Date.now();
    this.runAttempts++;
  }

  get isDone() {
    return this.status === 'success' || this.status === 'failed';
  }

  get isPending() {
    return this.status === 'pending';
  }

  get isSuccess() {
    return this.status === 'success';
  }

  get isError() {
    return this.status === 'error';
  }

  setAsFailed() {
    this.status = 'failed';
  }

  setInProgess() {
    this.status = 'pending';
  }
}