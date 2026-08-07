import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ApolloProvider } from "@/lib/apollo/provider";
import { Shell } from "@/components/layout/Shell";
import { CartProvider } from "@/components/commerce/CartProvider";
import { storeConfig } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: storeConfig.identity.name,
    template: storeConfig.seo.titleTemplate,
  },
  description: storeConfig.seo.defaultDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ApolloProvider>
          {/* No initialCart / no cart_count cookie — deferred until a real
              need (e.g. MiniCart) shows up, see docs/decisions.md, "Cart".
              app/cart/page.tsx nests its own CartProvider seeded with a
              fresh server fetch, which shadows this one for its subtree. */}
          <CartProvider>
            <Shell>{children}</Shell>
          </CartProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
