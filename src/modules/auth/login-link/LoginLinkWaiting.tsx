"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/lib/message";
import { authClient, type LoginLinkStart } from "@/lib/authClient";
import type { IUser } from "@/context/AuthContext";

const POLL_INTERVAL_MS = 2000;

type State = "pending" | "expired" | "rejected";

export default function LoginLinkWaiting({
  initial,
  onSuccess,
  onCancel,
  onResend,
}: {
  initial: LoginLinkStart;
  onSuccess: (user: IUser | null) => void;
  onCancel: () => void;
  onResend: () => Promise<LoginLinkStart | null>;
}) {
  const [link, setLink] = useState(initial);
  const [state, setState] = useState<State>("pending");
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(async () => {
        if (new Date(link.expiresAt).getTime() < Date.now()) {
          setState("expired");
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        let data: unknown;
        try {
          const res = await authClient.loginLink.poll({
            requestId: link.requestId,
            pollToken: link.pollToken,
          });
          data = res.data;
        } catch {
          return;
        }

        const result = data as {
          state: "pending" | "approved" | "rejected" | "expired" | "success";
          user?: IUser;
        };

        if (result.state === "success") {
          if (timerRef.current) clearInterval(timerRef.current);
          onSuccess(result.user ?? null);
        } else if (result.state === "rejected") {
          setState("rejected");
          if (timerRef.current) clearInterval(timerRef.current);
        } else if (result.state === "expired") {
          setState("expired");
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, POLL_INTERVAL_MS);
    }

    start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  const handleResend = async () => {
    setResending(true);
    try {
      const next = await onResend();
      if (next) {
        setLink(next);
        setState("pending");
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to resend link");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      {state === "pending" && (
        <>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Waiting for confirmation...
          </p>
          <p className="text-xs text-muted-foreground">
            Check the code below matches the one shown when you approve this
            login.
          </p>
          <div className="inline-block font-mono text-2xl font-bold tracking-widest bg-muted rounded-full px-6 py-3">
            {link.code}
          </div>
          <div className="text-xs text-muted-foreground">
            {link.deviceName} · {link.location}
          </div>
        </>
      )}

      {state === "expired" && (
        <p className="text-sm text-muted-foreground">
          This link expired. Send a new one to continue.
        </p>
      )}

      {state === "rejected" && (
        <p className="text-sm text-destructive">
          Login was rejected from the other device.
        </p>
      )}

      {(state === "expired" || state === "rejected") && (
        <Button
          type="button"
          className="w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Send new link"}
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
