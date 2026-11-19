import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import "./globals.css";

const inter = localFont({ src: "./inter.woff2", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Formwork · Estimate studio", template: "%s · Formwork" },
  description: "Concrete and masonry material estimates for architecture students.",
  icons: { icon: "/mark.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header>
          <div className="bar">
            <Link href="/" className="brand"><Image src="/mark.svg" alt="" width={34} height={34} />Formwork</Link>
            <nav aria-label="Main navigation">
              <Link href="/#tools">Tools</Link>
              <Link href="/quiz">Quiz</Link>
              <Link className="projectlink" href="/summary">My estimate <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" /></Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="wrap footer-inner">
            <div>
              <Link href="/" className="brand"><Image src="/mark.svg" alt="" width={27} height={27} />Formwork</Link>
              <p>Studio tools for architecture students.</p>
            </div>
            <nav aria-label="Footer navigation">
              <Link href="/guide">Material guide</Link>
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</Link>
              <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}


