import {
  updateSetting,
  getSetting,
} from "@/server/modules/setting/settings.service";

// Local-only CLI for writing a single `settings` row — primarily for secrets
// (broker/AI credentials, D12) that should never be typed into a chat
// transcript, a shell history shared with a third party, or `.env`. Values
// go straight into Postgres via the existing encrypted-at-rest path in
// settings.service.ts; nothing is echoed back except a masked confirmation.
//
// Usage (run locally, not through any shared terminal):
//   npm run db:set-setting -- --key broker_api_key --value <value> --group broker --type private
//   npm run db:set-setting -- --key broker_api_secret --value <value> --group broker --type private

function mask(value: string): string {
  if (!value) return "(empty)";
  if (value.length <= 4) return "*".repeat(value.length);
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const key = get("--key");
  const value = get("--value");
  const type = get("--type") || "private";

  if (!key || value === undefined) {
    console.error(
      "Usage: npm run db:set-setting -- --key <key> --value <value> [--type private|public]",
    );
    process.exit(1);
  }

  await updateSetting(key, value, type);
  const stored = await getSetting(key);
  console.log(`Set "${key}" (type=${type}) — stored value: ${mask(stored)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("set-setting failed:", err);
    process.exit(1);
  });
