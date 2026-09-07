import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display-campaign",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "C&J Pickleball • Championship Indoor Arena & Pro Club",
  description: "USA Pickleball specification 8mm cushioned indoor courts, pro carbon gear rentals, and instant online court reservation in Metro Manila.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#ffffff] text-[#111111] selection:bg-[#111111] selection:text-white">
        {children}
      </body>
    </html>
  );
}
