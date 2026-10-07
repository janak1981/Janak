import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  Mail,
  Sparkles,
} from "lucide-react";
import { getPortfolioContent } from "@/lib/supabase";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

const pageIcons = [Compass, BookOpen, Sparkles];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getPortfolioContent();
  const { settings, pages } = content;
  const cvPage = pages.find((page) => page.slug === "cv");

  return (
    <>
      <SiteHeader settings={settings} pages={pages} />
      <main>
        <section className="hero shell">
          <Reveal className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> {settings.role}</div>
            <h1>
              Ideas deserve
              <br />
              <em>room to grow.</em>
            </h1>
            <p className="hero-intro">{settings.introduction}</p>
            <div className="hero-actions">
              <Link className="button button-dark" href="/#about">
                A little about me <ArrowDown size={16} />
              </Link>
              {cvPage && (
                <Link className="text-link" href={`/${cvPage.slug}`}>
                  View my CV <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className="hero-note">
              <span className="note-line" />
              <span>{settings.location}</span>
            </div>
          </Reveal>
          <Reveal className="hero-art" ariaLabel="Illustration of an academic's reading desk">
            <div className="art-wash" />
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-window">
              <div className="window-cross" />
              <div className="window-hill hill-back" />
              <div className="window-hill hill-front" />
            </div>
            <div className="art-book book-one" />
            <div className="art-book book-two" />
            <div className="art-book book-three" />
            <div className="art-plant"><i /><i /><i /><i /><i /></div>
            <div className="art-caption">A curious life, in progress</div>
            <div className="art-monogram">{settings.initials || "J"}</div>
          </Reveal>
          <div className="hero-index"><span>01</span> / ACADEMIC PORTFOLIO</div>
        </section>

        <Reveal className="intro-section shell">
          <div className="section-label">
            <span className="section-number">01</span>
            <span>AN OPEN NOTE</span>
          </div>
          <div className="intro-content">
            <h2>A practice of paying attention.</h2>
            <p>{settings.about}</p>
            <p>
              Across classrooms, libraries, and conversations, I’m always
              looking for the questions that bring us closer to understanding.
            </p>
            <div className="signature">{settings.name}</div>
          </div>
          <div className="intro-aside">
            <div className="aside-rule" />
            <span>Currently</span>
            <p>{settings.availability}</p>
            <a href={`mailto:${settings.email}`}>
              Say hello <ArrowUpRight size={14} />
            </a>
          </div>
        </Reveal>

        <Reveal className="explore-section">
          <div className="shell">
            <div className="section-heading">
              <div>
                <div className="section-label">
                  <span className="section-number">02</span>
                  <span>EXPLORE</span>
                </div>
                <h2>A few paths in.</h2>
              </div>
              <p>Different threads, all part of the same conversation.</p>
            </div>
            <div className="explore-grid">
              {pages.slice(0, 3).map((page, index) => {
                const Icon = pageIcons[index % pageIcons.length];
                return (
                  <Reveal key={page.id} hover delay={index * 0.08}>
                    <Link className={`explore-card card-${index + 1}`} href={`/${page.slug}`}>
                    <div className="card-top">
                      <span className="card-index">0{index + 1}</span>
                      <span className="card-icon"><Icon size={19} strokeWidth={1.5} /></span>
                    </div>
                    <div className="card-bottom">
                      <span className="card-eyebrow">{page.eyebrow}</span>
                      <h3>{page.title}</h3>
                      <p>{page.description}</p>
                      <span className="card-arrow"><ArrowUpRight size={17} /></span>
                    </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
            <div className="all-pages">
              <span>More to explore</span>
              {pages.slice(3).map((page) => (
                <Link href={`/${page.slug}`} key={page.id}>{page.navLabel} <ArrowUpRight size={13} /></Link>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="contact-band shell">
          <div className="contact-mark"><Mail size={20} strokeWidth={1.5} /></div>
          <div>
            <span className="section-label">THE BEST IDEAS BEGIN SOMEWHERE</span>
            <h2>Let’s start a conversation.</h2>
          </div>
          <a href={`mailto:${settings.email}`} className="button button-outline">
            Get in touch <ArrowUpRight size={16} />
          </a>
        </Reveal>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
