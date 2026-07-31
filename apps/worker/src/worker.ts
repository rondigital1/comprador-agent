import {
  handleJob,
  scheduleGmailWork,
  scheduleShoppingResearch,
} from "./handlers";
import { workerEnv } from "./env";
import { claimNextJob, completeJob, failJob } from "./queue";

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function runWorker() {
  let shuttingDown = false;
  let lastScheduleAt = 0;
  const stop = () => {
    shuttingDown = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  console.info(`[worker] ${workerEnv.id} started`);

  while (!shuttingDown) {
    if (Date.now() - lastScheduleAt >= 60_000) {
      await scheduleGmailWork();
      await scheduleShoppingResearch();
      lastScheduleAt = Date.now();
    }

    const job = await claimNextJob(workerEnv.id);
    if (!job) {
      await pause(workerEnv.pollMs);
      continue;
    }

    try {
      await handleJob(job);
      await completeJob(job);
      console.info(`[worker] completed ${job.type} ${job.id}`);
    } catch (error) {
      await failJob(job, error);
      console.error(`[worker] failed ${job.type} ${job.id}`, error);
    }
  }

  console.info(`[worker] ${workerEnv.id} stopped`);
}
