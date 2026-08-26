"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { applyServerErrors } from "@/lib/formErrors";
import {
  brokerConnectionFormSchema,
  type BrokerConnectionFormInput,
} from "@/modules/broker/broker.validator";
import {
  BROKER,
  BROKER_LABEL,
  BROKER_SUPPORTED_MODES,
} from "@/modules/broker/broker.constants";

const CREDENTIAL_FIELDS: Record<
  string,
  { key: string; label: string; placeholder?: string }[]
> = {
  groww: [{ key: "accessToken", label: "Access Token (refresh daily)" }],
  dhan: [
    { key: "clientId", label: "Client ID" },
    { key: "accessToken", label: "Access Token" },
  ],
  delta: [
    { key: "apiKey", label: "API Key" },
    { key: "apiSecret", label: "API Secret" },
  ],
  paper: [],
};

interface BrokerConnectionFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
}

export default function BrokerConnectionForm({
  isEdit,
  id,
  onSuccess,
}: BrokerConnectionFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const form = useForm<BrokerConnectionFormInput>({
    resolver: zodResolver(brokerConnectionFormSchema),
    defaultValues: {
      broker: BROKER.PAPER,
      mode: "paper",
      risk_per_trade: 1000,
      max_signal_age_minutes: 15,
    },
  });

  const broker = form.watch("broker");

  const { data: connectionRes, isLoading } = useQuery({
    queryKey: ["broker-connection-edit", id],
    queryFn: () => httpRequest<ApiResult>("get", `broker-connections/${id}`),
    enabled: isEdit && !!id,
  });
  const connection = connectionRes?.data;

  /* eslint-disable react-hooks/set-state-in-effect -- populating form from fetched connection */
  useEffect(() => {
    if (connection) {
      form.reset({
        broker: connection.broker,
        mode: connection.mode,
        label: connection.label || "",
        risk_per_trade: Number(connection.risk_per_trade),
        capital: connection.capital ? Number(connection.capital) : undefined,
        max_qty: connection.max_qty ?? undefined,
        max_position_value: connection.max_position_value
          ? Number(connection.max_position_value)
          : undefined,
        max_open_positions: connection.max_open_positions ?? undefined,
        daily_loss_cap: connection.daily_loss_cap
          ? Number(connection.daily_loss_cap)
          : undefined,
        max_signal_age_minutes: connection.max_signal_age_minutes,
      });
    }
  }, [connection, form]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: BrokerConnectionFormInput) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        credentials: values.broker === BROKER.PAPER ? undefined : credentials,
      };

      const res = isEdit
        ? await httpRequest<ApiResult>(
            "patch",
            `broker-connections/${id}`,
            payload,
          )
        : await httpRequest<ApiResult>("post", "broker-connections", payload);

      if (res?.status === 1) {
        showSuccess(res.message || "Connection saved");
        onSuccess();
      } else {
        showError(res.message || "Failed to save connection");
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errors = (err?.data as Record<string, unknown>)?.errors as
        | Record<string, string>
        | undefined;
      if (errors) applyServerErrors(form.setError, errors);
      else showError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && isLoading) return <div>Loading...</div>;

  const modeOptions = BROKER_SUPPORTED_MODES[broker] ?? [];
  const credentialFields = CREDENTIAL_FIELDS[broker] ?? [];

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="broker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broker</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  form.setValue(
                    "mode",
                    BROKER_SUPPORTED_MODES[v]?.[0] ?? "live",
                  );
                  setCredentials({});
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(BROKER).map((b) => (
                    <SelectItem key={b} value={b}>
                      {BROKER_LABEL[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {modeOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g. My Groww account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {credentialFields.map((f) => (
          <FormItem key={f.key}>
            <FormLabel>{f.label}</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder={f.placeholder}
                value={credentials[f.key] ?? (isEdit ? "••••••••" : "")}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    [f.key]: e.target.value,
                  }))
                }
              />
            </FormControl>
          </FormItem>
        ))}

        <FormField
          control={form.control}
          name="risk_per_trade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Risk Per Trade <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capital"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capital</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.valueAsNumber || undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_qty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.valueAsNumber || undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_position_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Position Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.valueAsNumber || undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_open_positions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Open Positions</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.valueAsNumber || undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="daily_loss_cap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Loss Cap</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.valueAsNumber || undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_signal_age_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Max Signal Age (min) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 15)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button type="submit" disabled={submitting} className="mt-4">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Connection
      </Button>
    </Form>
  );
}
