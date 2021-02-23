import { makeGetRequest, HttpResponse, makePostRequest } from './utils/http';
import { Job, Queue } from './queue';
import { PingData } from './model/PingData';

async function main() {
  const pingQueue = new Queue({
    repeat: { repeatEach: true },
    delay: {
      beforeEach: true,
      initialInterval: 1000,
      intervalGrowthFactor: (interval) => interval
    }
  });

  const collectorQueue = new Queue({
    concurrency: { concurrentJobAmount: 5 },
    repeat: { attemptsLimit: 15 },
    delay: {
      initialInterval: 500,
      intervalGrowthFactor: (interval, runAttempts) => {
        return Math.round((Math.pow(2, runAttempts) - 1) * interval);
      }
    }
  });

  pingQueue.add(async() => {
    const start = Date.now();
    const response = await makeGetRequest('https://fundraiseup.com/');
    const responseTime = Date.now() - start;
    return {
      responseTime,
      response
    };
  });

  pingQueue.on<{ responseTime: number; response: HttpResponse; }>('success', job => {
    const pingData = {
      pingId: job.id,
      date: job.updatedAt,
      responseTime: job.result.responseTime
    };
    // console.log(`[PING] Done ${JSON.stringify(pingData)} ${job.result.response.statusCode}`);

    collectorQueue.add(async(job: Job) => {
      const storeData: PingData = {
        pingId: pingData.pingId,
        deliveryAttempt: job.runAttempts + 1,
        date: pingData.date,
        responseTime: pingData.responseTime
      };
      const response = await makePostRequest('http://localhost:8080/data', storeData, { timeout: 10000 });
      if (response.statusCode != 200) {
        throw new Error(`Invalid status code: ${response.statusCode}`);
      }
      return response.body;
    });
  });

  collectorQueue.on('job-status-change', job => {
    if (job.status === 'success' || job.status === 'failed' || job.status === 'error') {
      console.log(`[STORE] ${job.status}: ID: ${job.id} | ${job.runAttempts} | ${job.result}`);
      // console.log('active: ', collectorQueue.activeJobsIdList);
    }
  });

  pingQueue.start();
  collectorQueue.start();
}

main();
