import { Worker, type Job } from "bullmq";
import { queueConnection } from "@/server/lib/queue/connection";
import { getQueue, QUEUE_NAMES } from "@/server/lib/queue/queues";
import { deliverSignalToTelegram } from "@/server/modules/signal/signal-delivery.service";
import {
  processSignalForExecution,
  processSignalExit,
} from "@/server/modules/broker/execution.service";
import { syncAllInstruments } from "@/server/modules/broker/instrument-sync.service";
import { getSignalById } from "@/server/models/signal.repository";
import { infoLog, errorLog, warningLog } from "@/server/lib/logger";

function startWorker(
  queueName: string,
  concurrency: number,
  processor: (job: Job) => Promise<unknown>,
): Worker {
  const worker = new Worker(queueName, processor, {
    connection: queueConnection,
    concurrency,
  });
  worker.on("failed", (job, err) => {
    warningLog(`job attempt failed: ${queueName}/${job?.id} — ${err?.message}`);
  });
  worker.on("error", (err) =>
    errorLog(`worker error (${queueName}): ${err?.message}`),
  );
  return worker;
}

startWorker(QUEUE_NAMES.SIGNAL_DELIVER, 5, async (job) => {
  const { signalId } = job.data as { signalId: number };
  await deliverSignalToTelegram(signalId);
});

startWorker(QUEUE_NAMES.SIGNAL_EXECUTE, 3, async (job) => {
  const { signalId } = job.data as { signalId: number };
  const signal = await getSignalById(signalId);
  if (!signal) return;
  await processSignalForExecution(signal);
});

startWorker(QUEUE_NAMES.SIGNAL_EXIT, 3, async (job) => {
  const { signalId } = job.data as { signalId: number };
  const signal = await getSignalById(signalId);
  if (!signal) return;
  await processSignalExit(signal);
});

startWorker(QUEUE_NAMES.INSTRUMENT_SYNC, 1, async () => {
  await syncAllInstruments();
});

// Idempotent — BullMQ dedupes repeatable jobs by their repeat key, so re-registering on every
// worker restart never creates a second schedule. Daily at 02:00, well before Indian market open.
getQueue(QUEUE_NAMES.INSTRUMENT_SYNC)
  .upsertJobScheduler(
    "daily-instrument-sync",
    { pattern: "0 2 * * *" },
    { name: "sync" },
  )
  .catch((err: unknown) =>
    errorLog(
      `failed to schedule instrument.sync: ${err instanceof Error ? err.message : String(err)}`,
    ),
  );

infoLog("worker started", { queues: Object.values(QUEUE_NAMES) });

setInterval(() => {
  infoLog("worker heartbeat");
}, 60_000);
