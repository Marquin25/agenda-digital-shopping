import { SiteFooter, SiteHeader } from "@/ui/public/site-chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="container" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
