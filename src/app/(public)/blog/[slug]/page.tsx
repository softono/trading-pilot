import type { Metadata } from "next";
import BlogDetailPage from "@/modules/blog/BlogDetailPage";
import { findActiveBlogBySlug } from "@/server/models/blog.repository";
import { getFileUrl } from "@/server/lib/file";

export const revalidate = 3600; // 1h

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await findActiveBlogBySlug(slug);
  if (!blog) return {};

  const title = blog.meta_title || blog.title;
  const description = blog.meta_description || blog.excerpt || undefined;
  const image = getFileUrl(blog.image, "images");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default function Page() {
  return <BlogDetailPage />;
}
