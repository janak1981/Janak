import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { getPortfolioContent } from "@/lib/supabase";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getPortfolioContent();
  const page = content.pages.find((item) => item.slug === slug);
  if (!page) notFound();

  return (
    <>
      <SiteHeader settings={content.settings} pages={content.pages} />
      <main className="content-page shell">
        <div className="content-back"><Link href="/"><ArrowLeft size={15} /> Back home</Link></div>
        <div className="content-heading">
          <div className="section-label"><span className="section-number">—</span><span>{page.eyebrow}</span></div>
          <h1>{page.title}<span className="title-period">.</span></h1>
          <p>{page.description}</p>
        </div>
        <div className={`content-list ${page.kind}`}>
          {page.entries.map((entry, index) => (
            <Reveal key={`${entry.title}-${index}`} className="content-entry" delay={Math.min(index * 0.04, 0.2)}>
              <div className="entry-count">{String(index + 1).padStart(2, "0")}</div>
              <div className="entry-body">
                <div className="entry-meta"><CalendarDays size={13} /> {entry.meta}</div>
                <h2>{entry.title}</h2>
                <p>{entry.description}</p>
              </div>
              {entry.href && (
                <a className="entry-link" href={entry.href} target="_blank" rel="noreferrer" aria-label={`Open ${entry.title}`}>
                  {page.kind === "links" ? <ExternalLink size={17} /> : <ArrowUpRight size={17} />}
                </a>
              )}
            </Reveal>
          ))}
          {page.entries.length === 0 && (
            <div className="empty-page">
              <span>MORE TO COME</span>
              <p>This page is taking shape. Please check back soon.</p>
            </div>
          )}
        </div>
        <div className="content-contact"><span>Have a question about {page.title.toLowerCase()}?</span><a href={`mailto:${content.settings.email}`}>Write to me <ArrowUpRight size={14} /></a></div>
      </main>
      <SiteFooter settings={content.settings} />
    </>
  );
}
