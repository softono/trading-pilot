import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABEL } from "@/modules/account/user.constants";
import type { UserStatus } from "@/modules/account/user.types";

export function UserStatusBadge({ status }: { status: string }) {
  const entry =
    USER_STATUS_LABEL[status as UserStatus] ?? USER_STATUS_LABEL["inactive"];
  return (
    <Badge variant={entry.variant} className="rounded-md">
      {entry.label}
    </Badge>
  );
}
