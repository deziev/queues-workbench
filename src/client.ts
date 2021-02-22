import { makeGetRequest, HttpResponse, makePostRequest } from './utils/http';
import { Queue } from './queue/Queue';
import { Ticker } from './queue/Ticker';
import { Job } from './queue/Job';

async function main() {
  const ticker = new Ticker('ping', 1000);
  const pingQueue = new Queue();
  const collectorQueue = new Queue({
    repeat: { attemptsLimit: 5 },
    delay: {
      initialInterval: 500,
      intervalGrowthFactor: (interval, runAttempts) => {
        return Math.round((Math.pow(2, runAttempts) - 1) * interval);
      }
    }
  });

  ticker.on('ping', () => {
    pingQueue.add(async() => {
      const start = Date.now();
      const response = await makeGetRequest('https://fundraiseup.com/');
      const responseTime = Date.now() - start;
      return {
        responseTime,
        response
      };
    });
  });

  pingQueue.on<{ responseTime: number; response: HttpResponse; }>('success', job => {
    const pingData = {
      pingId: job.id,
      date: job.updatedAt,
      responseTime: job.result.responseTime
    };
    console.log(`[PING] Done ${JSON.stringify(pingData)} ${job.result.response.statusCode}`);

    collectorQueue.add(async(job: Job) => {
      const storeData = {
        pingId: pingData.pingId,
        deliveryAttempt: job.runAttempts + 1,
        date: pingData.date,
        responseTime: pingData.responseTime
      };
      await makePostRequest('http://localhost:8080/data', storeData, { timeout: 10000 });
    });
  });

  collectorQueue.on('error', job => {
    console.log(`[STORE] ${job.status}: ID: ${job.id} | ${job.runAttempts} | ${job.result}`);
  });

  collectorQueue.on('failed', job => {
    console.log(`[STORE] ${job.status}: ID: ${job.id} | ${job.runAttempts} | ${job.result}`);
  });

  pingQueue.start();
  collectorQueue.start();
}

main();
