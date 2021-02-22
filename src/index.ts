import { makeGetRequest, HttpResponse, makePostRequest } from './utils/http';
import { Queue } from './queue/Queue';
import { Ticker } from './queue/Ticker';

async function main() {
  const ticker = new Ticker('ping', 1000);
  const pingQueue = new Queue();
  const collectorQueue = new Queue({ repeat: { attemptsLimit: 256 } });

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
    console.log(`Done ${JSON.stringify(pingData)} ${job.result.response.statusCode}`);

    collectorQueue.add(async() => {
      await makePostRequest('http://localhost:8080/data', pingData);
    });
  });

  collectorQueue.on('error', job => {
    console.log(`Error: ${job.id} ${job.runAttempts} ${job.status} ${job.result}`);
  });

  pingQueue.start();
  collectorQueue.start();
}

main();
