export interface Subscription {
  id: number;
  analyst_id: string;
  status: string;
  started_at?: string;
  cancelled_at?: string | null;
  analyst_name?: string | null;
  analyst_slug?: string | null;
  analyst_avatar?: string | null;
}
