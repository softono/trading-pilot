import DynamicPage from "@/modules/page/DynamicPage";
import { getMetaData } from "@/server/modules/public/seo.service";

export const revalidate = 86400; // 24h

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const metaData = await getMetaData(slug);
  return metaData;
}

export default function Page() {
  return <DynamicPage />;
}
