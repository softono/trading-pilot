import { sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { Pagination, parsePaginationQuery } from "@/server/lib/pagination";
import { userSessions, users } from "@/server/models/schema";
import db from "@/server/lib/db";
import { eq } from "drizzle-orm";
import { deviceName } from "@/server/utils/clientInfo";
import { dateTimeFormat, getClientTimezone } from "@/server/lib/date";

async function handler(req: NextRequestWithAdmin) {
  const tz = getClientTimezone(req);
  const body = parsePaginationQuery(req.nextUrl.searchParams);

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const query = db
    .select({
      id: userSessions.id,
      user_id: userSessions.user_id,
      device_uid: userSessions.device_uid,
      user_agent: userSessions.user_agent,
      ip_address: userSessions.ip_address,
      created_at: userSessions.created_at,
      expires_at: userSessions.expires_at,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      role: users.role,
    })
    .from(userSessions)
    .leftJoin(users, eq(userSessions.user_id, users.id))
    .$dynamic();

  const res = await Pagination.paginate(
    query,
    validated.data,
    {
      user_agent: userSessions.user_agent,
      ip_address: userSessions.ip_address,
      created_at: userSessions.created_at,
    },
    {
      defaultSort: { field: "created_at", direction: "desc" },
      mapRow: (row: Record<string, unknown>) => ({
        ...row,
        user_agent: deviceName(row.user_agent as string),
        created_at: dateTimeFormat(row.created_at as Date, tz),
        expires_at: dateTimeFormat(row.expires_at as Date, tz),
      }),
    },
  );

  return sendResult(res);
}

export const GET = withAdminAuth(handler);
