import { Store } from "lucide-react";
import Link from "next/link";

/** Logo mark + name. `href` makes it a home link; without it, it is plain text. */
export function Brand({ tagline, href }: { tagline: string; href?: string }) {
  const content = (
    <>
      <span className="brand__mark" aria-hidden="true">
        <Store size={22} />
      </span>
      <span className="brand__text">
        <span className="brand__name">Conecta Shopping</span>
        <span className="brand__tagline">{tagline}</span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="brand">
      {content}
    </Link>
  ) : (
    <span className="brand">{content}</span>
  );
}
