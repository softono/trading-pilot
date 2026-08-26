import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import { type GeneralSettings } from "@/types/admin";
const DATE_FORMAT_OPTIONS = ["yyyy-MM-dd", "dd-MM-yyyy", "MM-dd-yyyy"] as const;

const DATE_TIME_FORMAT_OPTIONS = [
  "yyyy-MM-dd hh:mm a",
  "dd-MM-yyyy hh:mm a",
  "MM-dd-yyyy hh:mm a",
] as const;

function padValue(value: number) {
  return String(value).padStart(2, "0");
}

function formatPreview(date: Date, format: string) {
  const monthShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthLong = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;

  const isPM = hours24 >= 12;

  const map: Record<string, string> = {
    // year
    yyyy: String(date.getFullYear()),
    yy: String(date.getFullYear()).slice(-2),

    // month
    MM: padValue(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    MMM: monthShort[date.getMonth()],
    MMMM: monthLong[date.getMonth()],

    // day
    dd: padValue(date.getDate()),
    d: String(date.getDate()),

    // hour
    HH: padValue(hours24),
    hh: padValue(hours12),
    h: String(hours12),

    // minutes
    mm: padValue(date.getMinutes()),
    i: padValue(date.getMinutes()),

    // AM/PM (IMPORTANT FIX)
    a: isPM ? "pm" : "am",
    A: isPM ? "PM" : "AM",
  };

  // IMPORTANT: longer tokens first
  const regex = /(yyyy|MMMM|MMM|MM|dd|HH|hh|mm|yy|M|d|h|i|a|A|Y)/g;

  return format.replace(regex, (token) => map[token] || token);
}

function getFormatLabel(format: string, date: Date) {
  return formatPreview(date, format);
}

interface GeneralTabProps {
  form: GeneralSettings;
  setForm: (form: GeneralSettings) => void;
  refetch: () => void;
}

export function GeneralTab({ form, setForm, refetch }: GeneralTabProps) {
  const previewDate = new Date();
  const generalMutation = useMutation({
    mutationFn: (data: GeneralSettings) => {
      return httpRequest<ApiResult>("post", "admin/setting/save", data);
    },
    onSuccess: (response) => {
      if (response.status === 1) {
        refetch();
        setTimeout(
          () => showSuccess(response.message || "Settings saved successfully"),
          100,
        );
      } else {
        showError(response.message || "Failed to save settings");
      }
    },
    onError: () => showError("Failed to save settings"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        generalMutation.mutate(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="admin_email">
            Admin Contact Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="admin_email"
            type="email"
            value={form.admin_email}
            onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_format">Date Format</Label>
          <Select
            key={form.date_format}
            value={form.date_format}
            onValueChange={(value) => setForm({ ...form, date_format: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format">
                {getFormatLabel(form.date_format, previewDate)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMAT_OPTIONS.map((format) => (
                <SelectItem key={format} value={format}>
                  {getFormatLabel(format, previewDate)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_time_format">Date Time Format</Label>
          <Select
            key={form.date_time_format}
            value={form.date_time_format}
            onValueChange={(value) =>
              setForm({ ...form, date_time_format: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format">
                {getFormatLabel(form.date_time_format, previewDate)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DATE_TIME_FORMAT_OPTIONS.map((format) => (
                <SelectItem key={format} value={format}>
                  {getFormatLabel(format, previewDate)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="login_otp">Login With OTP</Label>
          <Select
            key={form.user_login_with_otp}
            value={form.user_login_with_otp}
            onValueChange={(value) =>
              setForm({ ...form, user_login_with_otp: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cookie_consent">Cookie Consent</Label>
          <Select
            key={form.cookie_consent}
            value={form.cookie_consent}
            onValueChange={(value) =>
              setForm({ ...form, cookie_consent: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email_verify">Email Verify</Label>
          <Select
            key={form.user_email_verify}
            value={form.user_email_verify}
            onValueChange={(value) =>
              setForm({ ...form, user_email_verify: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={generalMutation.isPending}>
        {generalMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}
