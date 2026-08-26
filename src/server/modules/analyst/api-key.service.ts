import { encrypt } from "@/server/lib/auth";
import { randomAlnum } from "@/server/lib/random";
import { infoLog } from "@/server/lib/logger";
import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import {
  listApiKeysForUser,
  createApiKey,
  revokeApiKeyForUser,
  apiKeySortMap,
} from "@/server/models/analyst-api-key.repository";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import type { ApiKeyCreateInput } from "@/modules/analyst/analyst.validator";

export async function listMyApiKeys(
  userId: string,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listApiKeysForUser(userId);

  return Pagination.paginate(query, body, apiKeySortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
      last_used_at: row.last_used_at
        ? dateTimeFormat(row.last_used_at as Date, tz)
        : null,
      revoked_at: row.revoked_at
        ? dateTimeFormat(row.revoked_at as Date, tz)
        : null,
    }),
  });
}

export async function generateApiKey(
  userId: string,
  data: ApiKeyCreateInput,
): Promise<ApiResult> {
  const keyId = `ak_${randomAlnum(24)}`;
  const secret = randomAlnum(40);

  const row = await createApiKey({
    user_id: userId,
    key_id: keyId,
    secret_encrypted: encrypt(secret),
    label: data.label,
  });

  infoLog("analyst api key generated", { userId, keyId });

  return {
    http_status: 201,
    status: 1,
    message:
      "API key generated — copy the secret now, it will not be shown again",
    data: {
      id: row.id,
      key_id: keyId,
      secret,
      label: row.label,
      created_at: row.created_at,
    },
  };
}

export async function revokeApiKey(
  id: number,
  userId: string,
): Promise<ApiResult> {
  const row = await revokeApiKeyForUser(id, userId);
  if (!row) {
    return { http_status: 404, status: 0, message: "API key not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "API key revoked successfully",
  };
}
