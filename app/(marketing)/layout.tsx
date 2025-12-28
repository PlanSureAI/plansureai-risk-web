import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header size="large" />
      {children}
    </>
  );
}
