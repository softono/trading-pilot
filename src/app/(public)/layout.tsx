import { MainLayout } from "../layout/main";
import CookieConsentComponent from "@/components/common/CookieConsent";
import { getPublicSettings } from "@/server/modules/setting/settings.service";
import { AuthProvider } from "@/context/AuthContext";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSettings();
  const cookieConsentEnabled = settings.cookie_consent === "1";

  return (
    <AuthProvider>
      <MainLayout>
        {children}
        <CookieConsentComponent enabled={cookieConsentEnabled} />
      </MainLayout>
    </AuthProvider>
  );
}
