import { sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { Pagination, parsePaginationQuery } from "@/server/lib/pagination";
import { userActivities, users } from "@/server/models/schema";
import db from "@/server/lib/db";
import { eq } from "drizzle-orm";
import { deviceName } from "@/server/utils/clientInfo";
import { USER_ACTIVITY } from "@/server/modules/account/user.constants";
import { dateTimeFormat, getClientTimezone } from "@/server/lib/date";

async function handler(req: NextRequestWithAdmin) {
  const tz = getClientTimezone(req);
  const body = parsePaginationQuery(req.nextUrl.searchParams);

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const query = db
    .select({
      id: userActivities.id,
      user_id: userActivities.user_id,
      type: userActivities.type,
      ip: userActivities.ip,
      client: userActivities.client,
      created_at: userActivities.created_at,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      role: users.role,
    })
    .from(userActivities)
    .leftJoin(users, eq(userActivities.user_id, users.id))
    .$dynamic();

  const res = await Pagination.paginate(
    query,
    validated.data,
    {
      type: userActivities.type,
      ip: userActivities.ip,
      client: userActivities.client,
      created_at: userActivities.created_at,
    },
    {
      defaultSort: { field: "created_at", direction: "desc" },
      mapRow: (row: Record<string, unknown>) => ({
        ...row,
        type: USER_ACTIVITY[row.type as keyof typeof USER_ACTIVITY] || row.type,
        client: deviceName(row.client as string),
        created_at: dateTimeFormat(row.created_at as Date, tz),
      }),
    },
  );

  return sendResult(res);
}

export const GET = withAdminAuth(handler);
