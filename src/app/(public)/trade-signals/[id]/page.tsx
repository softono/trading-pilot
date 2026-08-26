import type { Metadata } from "next";
import TradeSignalDetailPage from "@/modules/signal/TradeSignalDetailPage";
import { getPublicSignalById } from "@/server/models/signal.repository";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const signal = await getPublicSignalById(Number(id));
  if (!signal) return {};

  const title = `${signal.symbol} ${signal.side.toUpperCase()} Signal — ${signal.analyst_name}`;
  const description = `${signal.symbol} ${signal.side} trade signal${signal.horizon ? ` (${signal.horizon})` : ""} from ${signal.analyst_name}. Status: ${signal.status}.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signal = await getPublicSignalById(Number(id));

  const jsonLd = signal
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${signal.symbol} ${signal.side.toUpperCase()} Signal`,
        author: { "@type": "Person", name: signal.analyst_name },
        datePublished: signal.published_at
          ? new Date(signal.published_at).toISOString()
          : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TradeSignalDetailPage />
    </>
  );
}
