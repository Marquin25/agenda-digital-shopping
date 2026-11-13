import { PublicNav } from "@/ui/public/public-nav";
import { SiteFooter, SiteHeader } from "@/ui/public/site-chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-body">
      <SiteHeader />
      <main id="conteudo" className="container" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <PublicNav placement="bottom" />
    </div>
  );
}
