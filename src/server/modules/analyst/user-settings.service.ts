import {
  getSettingsForUser,
  upsertSettingsForUser,
} from "@/server/models/user-settings.repository";
import type { ApiResult } from "@/types";
import type { UserSettingsSaveInput } from "@/modules/analyst/analyst.validator";

export async function getMySettings(userId: string): Promise<ApiResult> {
  const row = await getSettingsForUser(userId);
  return {
    http_status: 200,
    status: 1,
    message: "Settings retrieved successfully",
    data: row ?? {
      webhook_enabled: true,
      allowed_ips: [],
      telegram_enabled: false,
      telegram_channel_id: null,
    },
  };
}

export async function updateMySettings(
  userId: string,
  data: Partial<UserSettingsSaveInput>,
): Promise<ApiResult> {
  const row = await upsertSettingsForUser(userId, data);
  return {
    http_status: 200,
    status: 1,
    message: "Settings updated successfully",
    data: row,
  };
}
