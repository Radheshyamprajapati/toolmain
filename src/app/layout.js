import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";

export const dynamic = "force-dynamic";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ToolHive – Equipment Rental Marketplace",
  description: "Rent and list tools for construction, electrical work, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
