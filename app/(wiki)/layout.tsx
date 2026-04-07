import type { ReactNode } from "react";

import { WikiShell } from "@/components/wiki-shell";
import { getNavigationData, getPublicWikiCopy, getPublishedArticles } from "@/lib/repository";

export default async function WikiLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const [navigation, copy, articles] = await Promise.all([
    getNavigationData(),
    getPublicWikiCopy(),
    getPublishedArticles()
  ]);
  const readingProgressSlugs = articles
    .filter((article) => Boolean(article.hitoId))
    .map((article) => article.slug);

  return (
    <WikiShell
      blocs={navigation.blocs}
      copy={copy.shell}
      eras={navigation.eras}
      readingProgressSlugs={readingProgressSlugs}
    >
      {children}
    </WikiShell>
  );
}
