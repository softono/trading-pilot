import { growwAdapter } from "@/server/modules/broker/adapters/groww.adapter";
import { dhanAdapter } from "@/server/modules/broker/adapters/dhan.adapter";
import { deltaAdapter } from "@/server/modules/broker/adapters/delta.adapter";
import { paperAdapter } from "@/server/modules/broker/adapters/paper.adapter";
import type { BrokerAdapter } from "@/server/modules/broker/adapters/types";
import { BROKER } from "@/modules/broker/broker.constants";

const ADAPTERS: Record<string, BrokerAdapter> = {
  [BROKER.GROWW]: growwAdapter,
  [BROKER.DHAN]: dhanAdapter,
  [BROKER.DELTA]: deltaAdapter,
  [BROKER.PAPER]: paperAdapter,
};

export function getAdapter(broker: string): BrokerAdapter {
  const adapter = ADAPTERS[broker];
  if (!adapter) throw new Error(`No adapter registered for broker "${broker}"`);
  return adapter;
}
