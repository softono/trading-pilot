import { Metadata } from "next";
import { type ISeo } from "@/server/models/seo";
import { findSeoByUrlCandidates } from "@/server/models/seo.repository";

function buildMetadata(seo: ISeo): Metadata {
  const title = seo.meta_title || seo.title || undefined;
  const description = seo.meta_description || seo.description || undefined;
  const keywordsStr = seo.meta_keyword || seo.keyword || undefined;

  return {
    title: title,
    description: description,

    keywords: keywordsStr?.split(",").map((v) => v.trim()),

    alternates: seo.canonical
      ? {
          canonical: seo.canonical,
        }
      : undefined,

    openGraph: {
      title: title,
      description: description,
      images: seo.image ? [seo.image] : [],
    },

    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: seo.image ? [seo.image] : [],
    },
  };
}

export async function getMetaData(url: string): Promise<Metadata> {
  const cleanUrl = url.replace(/^\/+|\/+$/g, "");
  const candidates = [
    cleanUrl,
    `/${cleanUrl}`,
    cleanUrl === "" ? "home" : cleanUrl,
  ];
  const seo = await findSeoByUrlCandidates(candidates);

  if (seo) {
    return buildMetadata(seo);
  }
  return {};
}
