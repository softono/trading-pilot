"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tsgrid/DataTable";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import type { AnalystApiKey } from "@/modules/signal/signal.types";

const API_KEYS_QUERY_KEY = ["analyst-api-keys"] as const;

export default function AnalystApiKeysPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<{
    key_id: string;
    secret: string;
  } | null>(null);

  const { deleteItem: handleRevoke } = useDeleteEntity<number>(
    (id: number) => httpRequest<ApiResult>("delete", `analyst/api-keys/${id}`),
    API_KEYS_QUERY_KEY,
    "API key",
  );

  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      const res = await httpRequest<ApiResult>("post", "analyst/api-keys", {
        label: label || undefined,
      });
      if (res?.status === 1) {
        setGeneratedSecret({
          key_id: res.data.key_id,
          secret: res.data.secret,
        });
        setCreateOpen(false);
        setLabel("");
      } else {
        showError(res.message || "Failed to generate API key");
      }
    } catch {
      showError("Failed to generate API key");
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = async () => {
    if (!generatedSecret) return;
    try {
      await navigator.clipboard.writeText(generatedSecret.secret);
      showSuccess("Secret copied to clipboard");
    } catch {
      showError("Could not copy — select and copy manually");
    }
  };

  const columns: ColumnDef<AnalystApiKey>[] = useMemo(
    () => [
      {
        id: "label",
        accessorKey: "label",
        header: "Label",
      },
      {
        id: "key_id",
        accessorKey: "key_id",
        header: "Key ID",
      },
      {
        id: "last_used_at",
        accessorKey: "last_used_at",
        header: "Last Used",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.revoked_at ? (
            <Badge variant="destructive">Revoked</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          !row.original.revoked_at && (
            <RevokeButton id={row.original.id} onConfirm={handleRevoke} />
          ),
      },
    ],
    [handleRevoke],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">API Keys</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AnalystApiKey>
            columns={columns}
            queryKey={API_KEYS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "analyst/api-keys", params)
            }
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Label (optional, e.g. production scanner)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={handleGenerate}>
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!generatedSecret}
        onOpenChange={(open) => !open && setGeneratedSecret(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Generated</DialogTitle>
            <DialogDescription>
              Copy this secret now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          {generatedSecret && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Key ID:</span>{" "}
                {generatedSecret.key_id}
              </p>
              <p className="break-all rounded bg-muted p-2 font-mono text-xs">
                {generatedSecret.secret}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={copySecret}>Copy Secret</Button>
            <Button variant="outline" onClick={() => setGeneratedSecret(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RevokeButton({
  id,
  onConfirm,
}: {
  id: number;
  onConfirm: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke API Key"
        description="Signals sent with this key will be rejected immediately. This cannot be undone."
        confirmText="Revoke"
        destructive
        onConfirm={() => onConfirm(id)}
      />
    </>
  );
}
