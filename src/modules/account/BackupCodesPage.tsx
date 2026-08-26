"use client";

import { useState } from "react";
import { showError, showSuccess } from "@/lib/message";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

type BackupCodesProps = { onClose: () => void };

export default function BackupCodes({ onClose }: BackupCodesProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");

  const handleRegenerate = async () => {
    if (!password) {
      showError("Please enter your password");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authClient.twoFactor.generateBackupCodes({
        password,
      });
      setBackupCodes(res.data?.backupCodes || []);
      showSuccess("Backup codes regenerated successfully");
      setPassword("");
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to regenerate backup codes"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex justify-center items-start pt-16">
      <div className="w-full max-w-xl px-4 sm:px-6 md:px-0">
        <div className="bg-background rounded-2xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Backup Codes</h2>
          </div>

          <div className="p-6">
            {backupCodes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="p-2 border text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Enter your password and click Regenerate to view new backup
                codes.
              </p>
            )}

            <div className="mt-4 max-w-sm">
              <label className="block text-sm font-medium mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="mb-4 mx-3"
              >
                Cancel
              </Button>

              <Button
                onClick={handleRegenerate}
                disabled={isSubmitting || !password}
              >
                {isSubmitting ? "Regenerating..." : "Regenerate"}
                <Upload size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
