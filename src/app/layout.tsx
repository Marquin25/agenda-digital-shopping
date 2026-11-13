import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Conecta Shopping — Agenda de eventos", template: "%s · Conecta Shopping" },
  description:
    "Programação de eventos, entretenimento e experiências do shopping. Sem aplicativo e sem cadastro.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17304f",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render every page per request so Next.js can attach the CSP nonce to its scripts (src/proxy.ts).
  await connection();
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
