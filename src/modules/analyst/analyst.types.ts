import type {
  ANALYST_TYPE,
  APPLICATION_STATUS,
} from "@/modules/analyst/analyst.constants";

export type AnalystType = (typeof ANALYST_TYPE)[keyof typeof ANALYST_TYPE];

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export interface AnalystApplication {
  id: number;
  user_id: string;
  pitch: string;
  experience_years?: number | null;
  specialties?: string[] | null;
  website?: string | null;
  status: ApplicationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
}

export interface UserSettings {
  id: number;
  user_id: string;
  webhook_enabled: boolean;
  allowed_ips?: string[] | null;
  telegram_enabled: boolean;
  telegram_channel_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnalystProfile {
  id: number;
  user_id: string;
  slug: string;
  display_name: string;
  headline?: string | null;
  bio?: string | null;
  avatar?: string | null;
  analyst_type: AnalystType;
  specialties?: string[] | null;
  socials?: Record<string, string> | null;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  email?: string;
}
