import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import "@fontsource-variable/plus-jakarta-sans";
import { NONCE_HEADER } from "@/infrastructure/web/content-security-policy";
import { THEME_INIT_SCRIPT } from "@/ui/theme/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Conecta Shopping — Agenda de eventos", template: "%s · Conecta Shopping" },
  description:
    "Programação de eventos, entretenimento e experiências do shopping. Sem aplicativo e sem cadastro.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a8461f",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render every page per request so Next.js can attach the CSP nonce to its scripts (src/proxy.ts).
  await connection();
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;
  return (
    // The theme script below may set data-theme before React hydrates.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
