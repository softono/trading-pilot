"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/lib/message";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";

type Info = {
  state: "pending" | "expired" | "rejected" | "approved" | "consumed";
  code?: string;
  deviceName?: string;
  location?: string;
};

export default function ApprovePage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id") || "";
  const token = searchParams.get("token") || "";

  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(!!requestId && !!token);
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (!requestId || !token) return;
    (async () => {
      try {
        const res = await authClient.loginLink.getApproval({
          requestId,
          token,
        });
        setInfo(res.data as Info);
      } catch (err: unknown) {
        showError(getErrorMessage(err, "Invalid or expired link"));
      }
      setLoading(false);
    })();
  }, [requestId, token]);

  const respond = async (action: "approve" | "reject") => {
    setActing(true);
    try {
      await authClient.loginLink.respond({ requestId, token, action });
      setDone(action);
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setActing(false);
    }
  };

  if (!requestId || !token) {
    return (
      <p className="text-center text-muted-foreground">
        Invalid approval link.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (done === "approve") {
    return (
      <p className="text-center text-muted-foreground">
        Login approved. You can return to your other device.
      </p>
    );
  }

  if (done === "reject") {
    return (
      <p className="text-center text-muted-foreground">
        Login request rejected.
      </p>
    );
  }

  if (!info || info.state !== "pending") {
    return (
      <p className="text-center text-muted-foreground">
        {info?.state === "rejected"
          ? "This login was already rejected."
          : info?.state === "consumed" || info?.state === "approved"
            ? "This login was already used."
            : "This link has expired."}
      </p>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <h4 className="text-xl font-semibold">Confirm Login</h4>
      <p className="text-sm text-muted-foreground">
        Approve this login only if the code below matches what you see on the
        device you&apos;re signing in from.
      </p>
      <div className="inline-block font-mono text-2xl font-bold tracking-widest bg-muted rounded-full px-6 py-3">
        {info.code}
      </div>
      <div className="text-sm text-muted-foreground">
        {info.deviceName} · {info.location}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={acting}
        onClick={() => respond("approve")}
      >
        Approve
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={acting}
        onClick={() => respond("reject")}
      >
        This wasn&apos;t me
      </Button>
    </div>
  );
}
