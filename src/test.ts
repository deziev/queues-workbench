import { Queue } from "./queue/Queue";

async function main() {
  const q = new Queue();

  q.add(async () => {
    console.log("job1");
    return "job1-OK";
  });

  q.add(async () => {
    console.log("job2");
    return "job2-OK";
  });

  q.add(async () => {
    console.log("job3");
    return "job3-OK";
  });

  q.on("success", (job) => {
    console.log(`${job.id} successfully done; ${job.result}`);
  });

  q.on("ended", (log) => {
    console.log("Reached queue end", log.size);
  });

  q.start();
}

main();
