import RegisterPage from "@/modules/auth/register/RegisterPage";
import { getMetaData } from "@/server/modules/public/seo.service";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export const revalidate = 86400; // 24h

export async function generateMetadata() {
  return await getMetaData("register");
}

export default async function Page() {
  const settings = await getPublicSettings();
  return (
    <RegisterPage
      googleRecaptchaEnabled={settings.google_recaptcha || "0"}
      googleRecaptchaPublicKey={settings.google_recaptcha_public_key || ""}
      // userEmailVerify={settings.user_email_verify}
    />
  );
}
