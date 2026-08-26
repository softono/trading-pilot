"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { showError, showSuccess } from "@/lib/message";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { Fingerprint, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface Passkey {
  id: string;
  name?: string | null;
  created_at: string;
}

export default function AdminAccountPasskeysPage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, setDeleteLoading] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

  const fetchPasskeys = useCallback(async () => {
    try {
      const res = await authClient.passkey.listUserPasskeys();
      setPasskeys((res.data as Passkey[]) || []);
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to load passkeys"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authClient.passkey.listUserPasskeys();
        if (!active) return;
        setPasskeys((res.data as Passkey[]) || []);
      } catch (err: unknown) {
        if (active) showError(getErrorMessage(err, "Failed to load passkeys"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = async () => {
    setAddLoading(true);
    try {
      await authClient.passkey.addPasskey({
        name: passkeyName.trim() || undefined,
      });
      showSuccess("Passkey added");
      setShowAddDialog(false);
      setPasskeyName("");
      fetchPasskeys();
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to add passkey"));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await authClient.passkey.deletePasskey({ id: deleteId });
      showSuccess("Passkey deleted");
      setDeleteId(null);
      fetchPasskeys();
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to delete passkey"));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <AccountBlock activeTab="Passkeys" basePath="/admin" />

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Passkey"
        description="This passkey will be permanently removed. You won't be able to sign in with it anymore."
        confirmText="Delete"
        onConfirm={handleDelete}
        destructive
      />

      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Add a Passkey</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>Give your passkey a name so you can identify it later.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <Input
              placeholder="e.g. MacBook Pro, iPhone"
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addLoading}>
              {addLoading ? "Adding..." : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-1 flex-col min-h-[90vh] sm:px-10">
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h5 className="text-lg font-semibold text-card-foreground">
                  Passkeys
                </h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Passkeys let you sign in without a password using your
                  device&apos;s biometrics or screen lock.
                </p>
              </div>
              <Button
                onClick={() => {
                  setPasskeyName("");
                  setShowAddDialog(true);
                }}
              >
                Add Passkey
              </Button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : passkeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No passkeys registered yet. Add one to enable passwordless
                  sign-in.
                </p>
              ) : (
                <div className="space-y-3">
                  {passkeys.map((pk) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Fingerprint className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {pk.name || "Unnamed passkey"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {pk.created_at}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(pk.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
