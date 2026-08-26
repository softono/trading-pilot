import { DateTime } from "luxon";
import config from "@/config";

function getTimezoneCookieName(): string {
  return `${config.APP_UID || "app"}_tz`;
}

export const clientTimezoneScript = `(function(){
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      document.cookie = '${getTimezoneCookieName()}=' + tz + '; path=/; max-age=31536000; SameSite=Lax';
    }
  } catch (e) {}
})()`;

export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatDateTime(
  date: string | Date,
  format: string = "yyyy-MM-dd HH:mm:ss",
): string {
  try {
    const dt =
      date instanceof Date
        ? DateTime.fromJSDate(date)
        : DateTime.fromJSDate(new Date(date));

    if (!dt.isValid) return "";
    return dt.toFormat(format);
  } catch {
    return "";
  }
}

export const currentTime = (format = "yyyy-MM-dd HH:mm:ss") =>
  formatDateTime(new Date(), format);
