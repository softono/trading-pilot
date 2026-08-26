import LoginPage from "@/modules/auth/login/LoginPage";
import { getMetaData } from "@/server/modules/public/seo.service";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export const revalidate = 86400;

export async function generateMetadata() {
  const metaData = await getMetaData("login");
  return metaData;
}

export default async function Page() {
  const settings = await getPublicSettings();
  return (
    <LoginPage
      userLoginWithOtp={settings.user_login_with_otp || "0"}
      googleRecaptchaEnabled={settings.google_recaptcha || "0"}
      googleRecaptchaPublicKey={settings.google_recaptcha_public_key || ""}
    />
  );
}
