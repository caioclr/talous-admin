import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talous Admin",
  description: "Painel administrativo do Talous AI para operações CVM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Painel congelado em pt-BR (ADR-002): `lang` e constante e o layout nao le
  // cookie — e o que permite as rotas voltarem a ser estaticas.
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
