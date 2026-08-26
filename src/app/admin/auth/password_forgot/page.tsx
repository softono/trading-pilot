import AdminForgotPasswordPage from "@/modules/admin/auth/password-forgot/AdminForgotPasswordPage";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export default async function Page() {
  const settings = await getPublicSettings();
  return (
    <AdminForgotPasswordPage
      googleRecaptchaEnabled={settings.google_recaptcha || "0"}
      googleRecaptchaPublicKey={settings.google_recaptcha_public_key || ""}
    />
  );
}
