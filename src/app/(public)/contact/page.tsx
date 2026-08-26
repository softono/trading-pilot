import ContactPage from "@/modules/public/ContactPage";
import { getMetaData } from "@/server/modules/public/seo.service";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export const revalidate = 86400;

export async function generateMetadata() {
  return await getMetaData("contact");
}

export default async function Page() {
  const settings = await getPublicSettings();
  return (
    <ContactPage
      googleRecaptchaEnabled={settings.google_recaptcha || "0"}
      googleRecaptchaPublicKey={settings.google_recaptcha_public_key || ""}
    />
  );
}
