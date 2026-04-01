import type { ReactNode } from "react";

import { WikiShell } from "@/components/wiki-shell";
import { getNavigationData, getPublicWikiCopy } from "@/lib/repository";

export default async function WikiLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const [navigation, copy] = await Promise.all([getNavigationData(), getPublicWikiCopy()]);

  return <WikiShell {...navigation} copy={copy.shell}>{children}</WikiShell>;
}
