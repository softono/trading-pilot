import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import { encrypt, decrypt } from "@/server/lib/auth";
import {
  listConnectionsForUser,
  getConnectionForUser,
  createConnection,
  updateConnectionForUser,
  deleteConnectionForUser,
} from "@/server/models/broker-connection.repository";
import { getAdapter } from "@/server/modules/broker/adapters/registry";
import { CONNECTION_STATUS } from "@/modules/broker/broker.constants";
import { brokerConnections } from "@/server/models/schema";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import type { BrokerConnectionSaveInput } from "@/modules/broker/broker.validator";
import type { IBrokerConnection } from "@/server/models/schema";

const connectionSortMap = {
  broker: brokerConnections.broker,
  status: brokerConnections.status,
  created_at: brokerConnections.created_at,
};

function withoutCredentials(row: IBrokerConnection) {
  const { credentials: _credentials, ...rest } = row;
  return rest;
}

export async function listMyConnections(
  userId: string,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listConnectionsForUser(userId);

  return Pagination.paginate(query, body, connectionSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...withoutCredentials(row as IBrokerConnection),
      created_at: dateTimeFormat(row.created_at as Date, tz),
      verified_at: row.verified_at
        ? dateTimeFormat(row.verified_at as Date, tz)
        : null,
    }),
  });
}

export async function createMyConnection(
  userId: string,
  data: BrokerConnectionSaveInput,
): Promise<ApiResult> {
  const row = await createConnection({
    user_id: userId,
    broker: data.broker,
    mode: data.mode,
    label: data.label,
    credentials: data.credentials
      ? encrypt(JSON.stringify(data.credentials))
      : null,
    status: CONNECTION_STATUS.UNVERIFIED,
    is_enabled: true,
    risk_per_trade: String(data.risk_per_trade),
    capital: data.capital !== undefined ? String(data.capital) : null,
    max_qty: data.max_qty,
    max_position_value:
      data.max_position_value !== undefined
        ? String(data.max_position_value)
        : null,
    max_open_positions: data.max_open_positions,
    daily_loss_cap:
      data.daily_loss_cap !== undefined ? String(data.daily_loss_cap) : null,
    max_signal_age_minutes: data.max_signal_age_minutes,
  });

  return {
    http_status: 201,
    status: 1,
    message: "Connection created — verify it before enabling live trading",
    data: withoutCredentials(row),
  };
}

export async function updateMyConnection(
  userId: string,
  id: number,
  data: Partial<BrokerConnectionSaveInput>,
): Promise<ApiResult> {
  const patch: Record<string, unknown> = { ...data };
  if (data.credentials) {
    patch.credentials = encrypt(JSON.stringify(data.credentials));
    // Credentials changed — connection must be re-verified before it can execute again.
    patch.status = CONNECTION_STATUS.UNVERIFIED;
  }
  if (data.risk_per_trade !== undefined)
    patch.risk_per_trade = String(data.risk_per_trade);
  if (data.capital !== undefined) patch.capital = String(data.capital);
  if (data.max_position_value !== undefined)
    patch.max_position_value = String(data.max_position_value);
  if (data.daily_loss_cap !== undefined)
    patch.daily_loss_cap = String(data.daily_loss_cap);

  const row = await updateConnectionForUser(id, userId, patch);
  if (!row) {
    return { http_status: 404, status: 0, message: "Connection not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Connection updated successfully",
    data: withoutCredentials(row),
  };
}

export async function deleteMyConnection(
  userId: string,
  id: number,
): Promise<ApiResult> {
  const row = await deleteConnectionForUser(id, userId);
  if (!row) {
    return { http_status: 404, status: 0, message: "Connection not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Connection deleted successfully",
  };
}

export async function verifyMyConnection(
  userId: string,
  id: number,
): Promise<ApiResult> {
  const row = await getConnectionForUser(id, userId);
  if (!row) {
    return { http_status: 404, status: 0, message: "Connection not found" };
  }

  const adapter = getAdapter(row.broker);
  const credentials = row.credentials
    ? (JSON.parse(decrypt(row.credentials)) as Record<string, string>)
    : {};
  const result = await adapter.verify(credentials, row.mode);

  await updateConnectionForUser(id, userId, {
    status: result.ok ? CONNECTION_STATUS.VERIFIED : CONNECTION_STATUS.ERROR,
    verified_at: result.ok ? new Date() : row.verified_at,
    last_error: result.ok ? null : result.error,
  });

  if (!result.ok) {
    return {
      http_status: 422,
      status: 0,
      message: result.error || "Verification failed",
    };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Connection verified successfully",
  };
}
