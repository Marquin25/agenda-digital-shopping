import Link from "next/link";
import { Brand } from "@/ui/brand";
import { ThemeToggle } from "@/ui/theme/theme-toggle";
import { BlackCatButton } from "./black-cat-button";
import { PublicNav } from "./public-nav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand href="/" tagline="Agenda de eventos e experiências" />
        <div className="site-header__actions">
          <PublicNav placement="top" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <ul>
          <li>
            <Link href="/">Agenda</Link>
          </li>
          <li>
            <Link href="/salvos">Salvos</Link>
          </li>
          <li>
            <Link href="/sugerir">Sugerir um evento</Link>
          </li>
          <li>
            <Link href="/privacidade">Privacidade</Link>
          </li>
        </ul>
        <p>
          Consulte a programação sem cadastro. Usamos um identificador aleatório deste dispositivo para contar
          acessos sem duplicar. <Link href="/privacidade">Saiba mais e apague seus dados</Link>.
        </p>
        <BlackCatButton />
      </div>
    </footer>
  );
}
