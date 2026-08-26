import ForgotPasswordPage from "@/modules/auth/forgot-password/ForgotPasswordPage";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export default async function Page() {
  const settings = await getPublicSettings();
  return (
    <ForgotPasswordPage
      googleRecaptchaEnabled={settings.google_recaptcha || "0"}
      googleRecaptchaPublicKey={settings.google_recaptcha_public_key || ""}
    />
  );
}
