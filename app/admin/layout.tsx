import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";

export const metadata: Metadata = {
  title: "Administración",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function AdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
