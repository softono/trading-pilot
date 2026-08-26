import type {
  SIGNAL_SIDE,
  SIGNAL_STATUS,
  WEBHOOK_EVENT,
} from "@/modules/signal/signal.constants";

export type SignalSide = (typeof SIGNAL_SIDE)[keyof typeof SIGNAL_SIDE];
export type SignalStatus = (typeof SIGNAL_STATUS)[keyof typeof SIGNAL_STATUS];
export type WebhookEvent = (typeof WEBHOOK_EVENT)[keyof typeof WEBHOOK_EVENT];

export interface SignalTarget {
  level: number;
  r_multiple?: number;
  basis?: string;
}

export interface SignalListItem {
  id: number;
  analyst_id: string;
  symbol: string;
  company_name?: string | null;
  exchange?: string | null;
  side: SignalSide;
  horizon?: string | null;
  setup_code?: string | null;
  status: string;
  event_risk?: boolean | null;
  published_at?: string | null;
  analyst_name?: string | null;
  analyst_slug?: string | null;
}

export interface SignalDetail extends SignalListItem {
  market: string;
  instrument_class: string;
  timeframe?: string | null;
  entry?: string | null;
  stop_loss?: string | null;
  targets?: SignalTarget[] | null;
  risk_score?: string | null;
  confidence?: string | null;
  ai_confidence?: string | null;
  thesis_pack?: Record<string, unknown> | null;
  key_risks?: string[] | null;
  detected_at?: string | null;
  exit_price?: string | null;
  exit_reason?: string | null;
  closed_at?: string | null;
  is_subscribed: boolean;
}

export interface AnalystApiKey {
  id: number;
  key_id: string;
  label?: string | null;
  last_used_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
}
