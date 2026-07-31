import { runWorker } from "./worker";

runWorker().catch((error) => {
  console.error("[worker] fatal error", error);
  process.exitCode = 1;
});
