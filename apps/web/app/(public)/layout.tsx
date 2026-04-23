import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui";
import { SaveListProvider } from "@/lib/save-list";
import { AgentMount } from "@/components/agent/AgentMount";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SaveListProvider>
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
        </div>
        <AgentMount />
      </SaveListProvider>
    </ToastProvider>
  );
}
