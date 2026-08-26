import { useMemo } from "react";
import { AvatarUpload } from "@/components/common/AvatarUpload";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { IUser } from "@/modules/account/user.types";

interface Props {
  user: IUser | null;
  updateUser: (user: IUser) => void;
  upload: (formData: FormData) => Promise<ApiResult>;
  remove: () => Promise<ApiResult>;
  currentImage?: string;
  onChange?: (file: File | null) => void;
}

// Context-free: callers pass user/updateUser from their own auth context
// (AuthContext or AdminAuthContext) plus the upload/remove requests.
export function ProfileImageUpload({
  user,
  updateUser,
  upload,
  remove,
  currentImage,
  onChange,
}: Props) {
  // eslint-disable-next-line react-hooks/purity, react-hooks/exhaustive-deps
  const cacheBust = useMemo(() => Date.now(), [currentImage, user?.image]);
  const image = currentImage || user?.image || "";

  return (
    <AvatarUpload
      image={image ? `${image}?t=${cacheBust}` : ""}
      upload={upload}
      remove={remove}
      onUploaded={(newImage, file) => {
        updateUser({ ...user!, image: newImage });
        onChange?.(file);
      }}
      onDeleted={() => {
        updateUser({ ...user!, image: "" });
        onChange?.(null);
      }}
    />
  );
}

export function userProfileImageRequests() {
  return {
    upload: (formData: FormData) =>
      httpRequest<ApiResult>("post", "account/update-image", formData),
    remove: () => httpRequest<ApiResult>("delete", "account/delete-image"),
  };
}

export function adminProfileImageRequests(userId: string | undefined) {
  return {
    upload: (formData: FormData) => {
      formData.append("user_id", String(userId || ""));
      return httpRequest<ApiResult>(
        "post",
        "admin/account/upload-image",
        formData,
      );
    },
    remove: () =>
      httpRequest<ApiResult>("delete", "admin/account/delete-image", {
        userId,
      }),
  };
}
