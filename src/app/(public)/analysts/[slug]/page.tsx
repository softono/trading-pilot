import type { Metadata } from "next";
import AnalystDetailPage from "@/modules/analyst/AnalystDetailPage";
import { getProfileBySlug } from "@/server/models/analyst-profile.repository";
import { getFileUrl } from "@/server/lib/file";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile || !profile.is_public) return {};

  const title = `${profile.display_name} — Trading Signals & Profile`;
  const description =
    profile.headline ||
    profile.bio?.slice(0, 160) ||
    `${profile.display_name}'s public analyst profile.`;
  const image = profile.avatar ? getFileUrl(profile.avatar) : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : [] },
    twitter: {
      card: "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default function Page() {
  return <AnalystDetailPage />;
}
