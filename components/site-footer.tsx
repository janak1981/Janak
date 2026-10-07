import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioSettings } from "@/lib/content";

export function SiteFooter({ settings }: { settings: PortfolioSettings }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <Link className="footer-name" href="/">{settings.name}<span> — KEEP ASKING BETTER QUESTIONS.</span></Link>
        <div className="footer-links">
          {settings.social.map((item) => (
            <a href={item.href} key={item.label} target={item.href.startsWith("mailto:") ? undefined : "_blank"} rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}>
              {item.label} <ArrowUpRight size={12} />
            </a>
          ))}
          <Link href="/admin" className="admin-link">Admin</Link>
        </div>
        <span className="footer-credit">© {new Date().getFullYear()} {settings.name}</span>
      </div>
    </footer>
  );
}
