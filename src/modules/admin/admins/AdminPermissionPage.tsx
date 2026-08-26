"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import type { PermissionItem } from "@/modules/account/permission/permission.types";
import { getPermissionListData } from "@/modules/account/permission";
import { showError, showSuccess } from "@/lib/message";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminPermission() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  const permissionListData = getPermissionListData();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const response = await httpRequest<ApiResult>(
          "get",
          `/admin/admins/${id}`,
        );
        const admin = response.data;
        if (admin?.permission) {
          setPermissions(
            admin.permission.split(",").map((p: string) => p.trim()),
          );
        }
      } catch {
        showError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setPermissions((prev) => {
      let newPermissions = [...prev];

      if (checked) {
        if (!newPermissions.includes(permissionKey)) {
          newPermissions.push(permissionKey);
        }

        const parentGroup = permissionListData.find(
          (group) => group.key === permissionKey,
        );
        if (parentGroup && parentGroup.list) {
          parentGroup.list.forEach((child: PermissionItem) => {
            if (!newPermissions.includes(child.key)) {
              newPermissions.push(child.key);
            }
          });
        }

        const childGroup = permissionListData.find((group) =>
          group.list?.some((p) => p.key === permissionKey),
        );
        if (childGroup && !newPermissions.includes(childGroup.key)) {
          newPermissions.push(childGroup.key);
        }
      } else {
        newPermissions = newPermissions.filter((p) => p !== permissionKey);

        const group = permissionListData.find((g) => g.key === permissionKey);
        if (group && group.list) {
          group.list.forEach((child) => {
            newPermissions = newPermissions.filter((p) => p !== child.key);
          });
        }

        const parentGroup = permissionListData.find((group) =>
          group.list?.some((p) => p.key === permissionKey),
        );
        if (parentGroup) {
          const hasOtherChildrenChecked = parentGroup.list!.some(
            (child) =>
              child.key !== permissionKey && newPermissions.includes(child.key),
          );
          if (!hasOtherChildrenChecked) {
            newPermissions = newPermissions.filter(
              (p) => p !== parentGroup.key,
            );
          }
        }
      }

      return newPermissions;
    });
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      const response = await httpRequest<ApiResult>(
        "patch",
        `/admin/admins/${id}`,
        {
          permission: permissions.join(","),
        },
      );
      if (response?.status === 1) {
        showSuccess(response.message || "Permission updated successfully");
        router.push("/admin/admins");
      } else {
        showError(response.message || "Failed to update permission");
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const resp = err?.response as Record<string, unknown> | undefined;
      const respData = resp?.data as Record<string, unknown> | undefined;
      const errorMessage =
        (respData?.message as string) ||
        (error instanceof Error ? error.message : undefined) ||
        "Failed to update permission";
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Admin Permission" backUrl="/admin/admins" />
      <Card>
        <CardHeader>
          <CardTitle>Permission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {permissionListData.map((permissionGroup) => (
                  <div
                    key={permissionGroup.key}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={permissionGroup.key}
                        checked={
                          permissions.includes(permissionGroup.key) ||
                          (permissionGroup.list &&
                            permissionGroup.list.some((p) =>
                              permissions.includes(p.key),
                            ))
                        }
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            permissionGroup.key,
                            checked as boolean,
                          )
                        }
                      />
                      <label
                        htmlFor={permissionGroup.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permissionGroup.title}
                      </label>
                    </div>
                    {permissionGroup.list &&
                      permissionGroup.list.length > 0 && (
                        <div className="ml-4 space-y-2 ">
                          {permissionGroup.list.map((permission) => (
                            <div
                              key={permission.key}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={permission.key}
                                checked={permissions.includes(permission.key)}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    permission.key,
                                    checked as boolean,
                                  )
                                }
                              />
                              <label
                                htmlFor={permission.key}
                                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {permission.title}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={handleSave} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Permission"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
