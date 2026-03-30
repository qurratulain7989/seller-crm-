import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SellerBook — Pakistani Seller CRM",
  description: "Apne customers ka complete record rakhen. AI se WhatsApp message parse karen.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
