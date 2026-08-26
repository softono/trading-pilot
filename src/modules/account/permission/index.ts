import PERMISSIONS from "@/modules/account/permission/permissions.constants";

export function hasPermission(
  permission: string | string[],
  userPermission: string = "",
): boolean {
  if (permission === "") {
    permission = window.location.pathname;
  }
  if (userPermission === null) {
    userPermission = "";
  }
  if (Array.isArray(permission)) {
    return permission.some((p) => checkPermission(p, userPermission));
  }
  return checkPermission(permission, userPermission);
}

export function getPermissionListData() {
  return PERMISSIONS;
}

function checkPermission(permission: string, userPermission: string): boolean {
  if (getPermissionList().includes(permission)) {
    return userPermission.split(",").includes(permission);
  }
  return true;
}

export function getPermissionList(): string[] {
  const permissionList: string[] = [];
  PERMISSIONS.forEach((group) => {
    permissionList.push(group.key);
    if (group.list) {
      group.list.forEach((item) => permissionList.push(item.key));
    }
  });
  return permissionList;
}

const ROUTE_PERMISSIONS: Record<string, string> = {};
for (const group of PERMISSIONS) {
  if (!group.list) continue;
  for (const item of group.list) {
    if (item.route) {
      ROUTE_PERMISSIONS[item.route] = item.key;
    }
  }
}

export function getRoutePermission(pathname: string): string | null {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];

  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.includes("[")) {
      const pattern = new RegExp(
        "^" + route.replace(/\[[\w]+\]/g, "[^/]+") + "$",
      );
      if (pattern.test(pathname)) return permission;
    }
  }

  return null;
}
