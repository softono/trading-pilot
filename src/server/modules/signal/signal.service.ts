import {
  getSignalByAnalystAndLogicalId,
  insertSignal,
  updateSignal,
} from "@/server/models/signal.repository";
import { createSignalEvent } from "@/server/models/signal-event.repository";
import { infoLog } from "@/server/lib/logger";
import {
  getQueue,
  signalDeliverJobId,
  signalExecuteJobId,
  signalExitJobId,
  DEFAULT_JOB_OPTS,
  EXECUTE_JOB_OPTS,
  QUEUE_NAMES,
} from "@/server/lib/queue/queues";
import { SIGNAL_STATUS } from "@/modules/signal/signal.constants";
import type { ApiResult } from "@/types";
import type { SignalWebhookInput } from "@/modules/signal/signal.validator";
import type { NewSignal } from "@/server/models/schema";

// Only these transitions reach Telegram — a fresh publish and a terminal outcome (round-4 Q3
// decision). Intermediate states (e.g. ACTIVE) would just be noise.
const TELEGRAM_STATUSES: string[] = [
  SIGNAL_STATUS.PUBLISHED,
  SIGNAL_STATUS.TARGET_REACHED,
  SIGNAL_STATUS.STOPPED,
  SIGNAL_STATUS.FAILED,
  SIGNAL_STATUS.EXPIRED,
];

const EXIT_STATUSES: string[] = [
  SIGNAL_STATUS.TARGET_REACHED,
  SIGNAL_STATUS.STOPPED,
  SIGNAL_STATUS.FAILED,
  SIGNAL_STATUS.EXPIRED,
];

async function handleStatusSideEffects(
  signalId: number,
  status: string,
): Promise<void> {
  try {
    if (TELEGRAM_STATUSES.includes(status)) {
      await getQueue(QUEUE_NAMES.SIGNAL_DELIVER).add(
        "deliver",
        { signalId },
        { ...DEFAULT_JOB_OPTS, jobId: signalDeliverJobId(signalId, status) },
      );
    }
    if (status === SIGNAL_STATUS.PUBLISHED) {
      await getQueue(QUEUE_NAMES.SIGNAL_EXECUTE).add(
        "execute",
        { signalId },
        { ...EXECUTE_JOB_OPTS, jobId: signalExecuteJobId(signalId) },
      );
    }
    if (EXIT_STATUSES.includes(status)) {
      await getQueue(QUEUE_NAMES.SIGNAL_EXIT).add(
        "exit",
        { signalId },
        { ...DEFAULT_JOB_OPTS, jobId: signalExitJobId(signalId, status) },
      );
    }
  } catch (err: unknown) {
    infoLog("failed to enqueue signal side-effect job", {
      signalId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function toRow(
  analystId: string,
  data: SignalWebhookInput,
): Omit<NewSignal, "id" | "created_at" | "updated_at"> {
  return {
    analyst_id: analystId,
    logical_signal_id: data.logical_signal_id,
    revision_no: data.revision_no,
    symbol: data.symbol,
    company_name: data.company_name,
    exchange: data.exchange,
    market: data.market,
    instrument_class: data.instrument_class,
    side: data.side,
    horizon: data.horizon,
    timeframe: data.timeframe,
    setup_code: data.setup_code,
    entry: data.entry,
    stop_loss: data.stop_loss,
    targets: data.targets,
    risk_score: data.risk_score,
    confidence: data.confidence,
    ai_confidence: data.ai_confidence,
    event_risk: data.event_risk,
    ttl_expires_at: data.ttl_expires_at ? new Date(data.ttl_expires_at) : null,
    thesis_pack: data.thesis_pack ?? {},
    key_risks: data.key_risks ?? [],
    evidence: data.evidence ?? {},
    status: data.status,
    detected_at: data.detected_at ? new Date(data.detected_at) : null,
    published_at: data.published_at ? new Date(data.published_at) : null,
    invalidated_at: data.invalidated_at ? new Date(data.invalidated_at) : null,
    invalidation_reason: data.invalidation_reason,
    exit_price: data.exit_price,
    exit_reason: data.exit_reason,
    closed_at: data.closed_at ? new Date(data.closed_at) : null,
    payload: data,
  };
}

export async function processWebhookSignal(
  analystId: string,
  data: SignalWebhookInput,
): Promise<ApiResult> {
  const existing = await getSignalByAnalystAndLogicalId(
    analystId,
    data.logical_signal_id,
  );

  if (!existing) {
    const row = await insertSignal(toRow(analystId, data));
    await createSignalEvent({
      signal_id: row.id,
      from_status: null,
      to_status: data.status,
      reason: data.event,
    });
    infoLog("signal received (new)", {
      analystId,
      logicalSignalId: data.logical_signal_id,
      status: data.status,
    });
    await handleStatusSideEffects(row.id, data.status);
    return {
      http_status: 201,
      status: 1,
      message: "Signal recorded",
      data: { id: row.id },
    };
  }

  if (data.revision_no < existing.revision_no) {
    return {
      http_status: 409,
      status: 0,
      message: "Stale revision — a newer revision has already been recorded",
    };
  }

  if (
    data.revision_no === existing.revision_no &&
    data.status === existing.status
  ) {
    // Retry of an already-applied delivery — idempotent no-op.
    return {
      http_status: 200,
      status: 1,
      message: "Signal already up to date",
      data: { id: existing.id },
    };
  }

  const row = await updateSignal(existing.id, toRow(analystId, data));
  const statusChanged = data.status !== existing.status;
  if (statusChanged) {
    await createSignalEvent({
      signal_id: existing.id,
      from_status: existing.status,
      to_status: data.status,
      reason: data.event,
    });
    await handleStatusSideEffects(existing.id, data.status);
  }

  infoLog("signal received (update)", {
    analystId,
    logicalSignalId: data.logical_signal_id,
    fromStatus: existing.status,
    toStatus: data.status,
  });

  return {
    http_status: 200,
    status: 1,
    message: "Signal updated",
    data: { id: row?.id ?? existing.id },
  };
}
