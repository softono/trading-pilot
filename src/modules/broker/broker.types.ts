import type {
  BROKER,
  BROKER_MODE,
  CONNECTION_STATUS,
  EXECUTION_STATUS,
} from "@/modules/broker/broker.constants";

export type Broker = (typeof BROKER)[keyof typeof BROKER];
export type BrokerMode = (typeof BROKER_MODE)[keyof typeof BROKER_MODE];
export type ConnectionStatus =
  (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];
export type ExecutionStatus =
  (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export interface BrokerConnection {
  id: number;
  user_id: string;
  broker: Broker;
  mode: BrokerMode;
  label?: string | null;
  status: ConnectionStatus;
  verified_at?: string | null;
  last_error?: string | null;
  is_enabled: boolean;
  risk_per_trade: string;
  capital?: string | null;
  max_qty?: number | null;
  max_position_value?: string | null;
  max_open_positions?: number | null;
  daily_loss_cap?: string | null;
  max_signal_age_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderExecution {
  id: number;
  connection_id: number;
  signal_id: number;
  status: ExecutionStatus;
  reason?: string | null;
  qty?: number | null;
  entry_price?: string | null;
  broker_order_id?: string | null;
  stop_order_id?: string | null;
  attempts: number;
  created_at?: string;
  updated_at?: string;
  symbol?: string | null;
  side?: string | null;
  broker?: string | null;
}
