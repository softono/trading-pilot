import { users } from "@/server/models/schema";
import { USER_ROLES } from "@/modules/account/user.constants";

import type { ApiResult } from "@/types";
import { Pagination } from "@/server/lib/pagination";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import {
  buildFilter,
  type FilterMap,
} from "@/server/lib/pagination/buildFilter";
import { dateTimeFormat } from "@/server/lib/date";
import { getFileUrl } from "@/server/lib/file";
import {
  listAdmins as listAdminsQuery,
  adminSortMap,
  findAdminProfileById,
} from "@/server/models/user.repository";

const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

const adminFilterMap: FilterMap = {
  name: { column: users.first_name, type: "text" },
  email: { column: users.email, type: "text" },
  phone: { column: users.phone, type: "text" },
  status: { column: users.status, type: "multiSelect" },
};

export async function listAdmins(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();
  const filterWhere = buildFilter(adminFilterMap, body.filter);

  const query = listAdminsQuery(adminRoles, search, filterWhere);

  return Pagination.paginate(query, body, adminSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      image: row.image ? getFileUrl(row.image, "profile") : "",
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function getAdminProfileById(
  adminId: string | number,
  tz: string,
): Promise<ApiResult> {
  const adminRow = await findAdminProfileById(adminId);

  if (!adminRow) {
    return { http_status: 404, status: 0, message: "Admin not found" };
  }

  return {
    http_status: 200,
    status: 1,
    message: "Admin profile fetched successfully",
    data: {
      ...adminRow,
      image: getFileUrl(adminRow.image, "profile"),
      created_at: dateTimeFormat(adminRow.created_at, tz),
      updated_at: dateTimeFormat(adminRow.updated_at, tz),
    },
  };
}
