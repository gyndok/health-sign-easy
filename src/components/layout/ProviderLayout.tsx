import { ProviderNav } from "./ProviderNav";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

export function ProviderLayout({ children }: ProviderLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <ProviderNav />
      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}
