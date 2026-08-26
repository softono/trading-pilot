"use client";

import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useAuth } from "@/context/AuthContext";
interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter();
  const auth = useAuth();

  const handleSignOut = () => {
    auth.logout();
    router.push("/login");
  };
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign Out"
      description="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign Out"
      destructive
      onConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
