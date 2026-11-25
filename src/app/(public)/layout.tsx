import { PublicFooter } from "@/components/layouts/public-footer";
import { PublicHeader } from "@/components/layouts/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
