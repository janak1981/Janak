import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioPage, PortfolioSettings } from "@/lib/content";

export function SiteHeader({
  settings,
  pages,
}: {
  settings: PortfolioSettings;
  pages: PortfolioPage[];
}) {
  return (
    <header className="site-header shell">
      <Link className="wordmark" href="/" aria-label={`${settings.name} home`}>
        <span className="wordmark-symbol">{settings.initials || "J"}</span>
        <span>{settings.name}<small>PERSONAL ACADEMIC PORTFOLIO</small></span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        {pages.map((page) => (
          <Link key={page.id} href={`/${page.slug}`}>{page.navLabel}</Link>
        ))}
      </nav>
      <Link href={`mailto:${settings.email}`} className="header-contact">
        Get in touch <ArrowUpRight size={14} />
      </Link>
    </header>
  );
}
