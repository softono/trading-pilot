"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import PageHeader from "@/components/admin/PageHeader";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { useAuth } from "@/context/AdminAuthContext";
import type { AnalystApplication } from "@/modules/analyst/analyst.types";
import { APPLICATION_STATUS_LABEL } from "@/modules/analyst/analyst.constants";

const APPLICATION_QUERY_KEY = ["analyst-applications"] as const;

export default function AnalystApplicationViewPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    data: appRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...APPLICATION_QUERY_KEY, id],
    queryFn: () =>
      httpRequest<ApiResult<AnalystApplication>>(
        "get",
        `admin/analyst-applications/${id}`,
      ),
    enabled: !!id,
  });

  const application = appRes?.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: [...APPLICATION_QUERY_KEY, id] });
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      const res = await httpRequest<ApiResult>(
        "post",
        `admin/analyst-applications/${id}/approve`,
      );
      if (res?.status === 1) {
        showSuccess(res.message || "Application approved");
        invalidate();
      } else {
        showError(res.message || "Failed to approve application");
      }
    } catch {
      showError("Failed to approve application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showError("Please provide a rejection reason");
      return;
    }
    try {
      setSubmitting(true);
      const res = await httpRequest<ApiResult>(
        "post",
        `admin/analyst-applications/${id}/reject`,
        { rejection_reason: rejectionReason },
      );
      if (res?.status === 1) {
        showSuccess(res.message || "Application rejected");
        setRejectOpen(false);
        invalidate();
      } else {
        showError(res.message || "Failed to reject application");
      }
    } catch {
      showError("Failed to reject application");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !application) {
    return <p className="text-destructive">Application not found.</p>;
  }

  const statusEntry =
    APPLICATION_STATUS_LABEL[application.status] ??
    APPLICATION_STATUS_LABEL.pending;
  const canReview =
    hasPermission("admin/analyst-application/review") &&
    application.status === "pending";

  return (
    <>
      <PageHeader
        title="Analyst Application"
        backUrl="/admin/analyst-applications"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {`${application.first_name || ""} ${application.last_name || ""}`.trim()}
            <Badge variant={statusEntry.variant}>{statusEntry.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <span className="font-medium">Email:</span> {application.email}
          </p>
          <p>
            <span className="font-medium">Experience:</span>{" "}
            {application.experience_years ?? "—"} years
          </p>
          {application.website && (
            <p>
              <span className="font-medium">Website:</span>{" "}
              <a
                href={application.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {application.website}
              </a>
            </p>
          )}
          {!!application.specialties?.length && (
            <p>
              <span className="font-medium">Specialties:</span>{" "}
              {application.specialties.join(", ")}
            </p>
          )}
          <div>
            <p className="font-medium">Pitch</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {application.pitch}
            </p>
          </div>
          {application.status === "rejected" &&
            application.rejection_reason && (
              <p className="text-destructive">
                Rejection reason: {application.rejection_reason}
              </p>
            )}

          {canReview && (
            <div className="flex gap-3 pt-2">
              <ConfirmationDialog
                title="Approve Application"
                description="This will make the applicant an analyst and create their public profile."
                confirmText="Approve"
                onConfirm={handleApprove}
              >
                <Button disabled={submitting}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </ConfirmationDialog>

              <Button
                variant="destructive"
                disabled={submitting}
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection"
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={handleReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
