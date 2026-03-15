import type { ReactNode } from "react";

import { WikiShell } from "@/components/wiki-shell";
import { getNavigationData } from "@/lib/repository";

export default function WikiLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const navigation = getNavigationData();

  return <WikiShell {...navigation}>{children}</WikiShell>;
}
