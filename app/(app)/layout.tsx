import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header size="small" />
      {children}
    </>
  );
}
