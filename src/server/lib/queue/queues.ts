import { Queue, type JobsOptions } from "bullmq";
import { queueConnection } from "@/server/lib/queue/connection";

export const QUEUE_NAMES = {
  SIGNAL_DELIVER: "signal.deliver",
  SIGNAL_EXECUTE: "signal.execute",
  SIGNAL_EXIT: "signal.exit",
  INSTRUMENT_SYNC: "instrument.sync",
} as const;

const DEFAULT_JOB_OPTS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 3000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 1000 },
};

// An execution retry that lands minutes late can place a trade the signal no longer justifies
// (round-3 Q7 decision) — a short, bounded retry budget only, no exponential creep into staleness.
const EXECUTE_JOB_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: "fixed", delay: 5000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 1000 },
};

const queueCache = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  const existing = queueCache.get(name);
  if (existing) return existing;
  const queue = new Queue(name, { connection: queueConnection });
  queueCache.set(name, queue);
  return queue;
}

// Deterministic on (signalId, status) — a signal's status is monotonic through its lifecycle
// (PUBLISHED -> ACTIVE -> TARGET_REACHED/STOPPED/..., never revisited), so this collapses any
// duplicate processing of the same transition into one job instead of double-executing/-delivering.
export function signalDeliverJobId(signalId: number, status: string): string {
  return `deliver|${signalId}|${status}`;
}

export function signalExecuteJobId(signalId: number): string {
  return `execute|${signalId}`;
}

export function signalExitJobId(signalId: number, status: string): string {
  return `exit|${signalId}|${status}`;
}

export { DEFAULT_JOB_OPTS, EXECUTE_JOB_OPTS };
