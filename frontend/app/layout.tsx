import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechMart Support | Multi-Agent AI Assistant",
  description: "Enterprise AI-powered customer support with specialized billing, technical, product, complaint, and FAQ agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-canvas text-text-primary selection:bg-brand-subtle selection:text-brand">
        {children}
      </body>
    </html>
  );
}

