"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  LockKeyhole,
  MoveRight,
  Plus,
  Save,
  ShieldCheck,
  Settings,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  isPortfolioContent,
  normalizeSlug,
  starterContent,
  type PortfolioContent,
  type PortfolioEntry,
  type PortfolioPage,
} from "@/lib/content";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Section = "overview" | "pages" | "profile";
const localPreviewStorageKey = "janak-portfolio-local-preview";

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [registrationAvailable, setRegistrationAvailable] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [content, setContent] = useState<PortfolioContent>(starterContent);
  const [section, setSection] = useState<Section>("overview");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(!hasSupabaseConfig);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setErrorMessage(error.message);
      setAuthenticated(Boolean(data.session));
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || authenticated) return;
    let active = true;
    void fetch("/api/admin/register", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to check administrator registration.");
        return response.json() as Promise<{ available: boolean }>;
      })
      .then(({ available }) => {
        if (active) setRegistrationAvailable(available);
      })
      .catch(() => {
        if (active) {
          setRegistrationAvailable(false);
          setErrorMessage("Unable to check admin registration. Verify the Supabase server settings and reload.");
        }
      });
    return () => { active = false; };
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || !supabase) return;
    let active = true;
    void supabase
      .from("portfolio_content")
      .select("data")
      .eq("id", "primary")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        if (data?.data && isPortfolioContent(data.data)) {
          setContent(data.data);
        } else {
          setErrorMessage("Your portfolio is ready to set up. Save your changes to publish the starter content.");
        }
      });
    return () => { active = false; };
  }, [authenticated]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMessage(error.message);
    } catch (error) {
      console.error("Unable to reach the admin sign-in service:", error);
      setErrorMessage("Unable to reach the sign-in service. Please try again.");
    }
    setBusy(false);
  }

  async function sendPasswordReset() {
    if (!supabase || !email) {
      setErrorMessage("Enter your account email first.");
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) setErrorMessage(error.message);
      else setResetSent(true);
    } catch (error) {
      console.error("Unable to request an admin password reset:", error);
      setErrorMessage("Unable to reach the password reset service. Please try again.");
    }
    setBusy(false);
  }

  async function registerAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Your passwords don’t match.");
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, setupCode }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setErrorMessage(result.error || "Unable to create the administrator account.");
        setBusy(false);
        return;
      }

      if (!supabase) {
        setErrorMessage("The administrator account was created, but sign-in is not configured.");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setRegistrationAvailable(false);
      setRegistrationMode(false);
      setPassword("");
      setConfirmPassword("");
      setSetupCode("");
      if (error) {
        setErrorMessage(`Your account was created. Please sign in with your new password: ${error.message}`);
      }
    } catch {
      setErrorMessage("Unable to reach the registration service. Please try again.");
    }
    setBusy(false);
  }

  async function signOut() {
    if (!supabase) {
      setAuthenticated(false);
      setPreviewMode(false);
      setNotice("");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) setErrorMessage(error.message);
    else setNotice("You’re signed out.");
  }

  async function saveContent(next: PortfolioContent) {
    const slugs = next.pages.map((page) => page.slug);
    if (slugs.some((slug) => !slug || slug === "admin")) {
      setErrorMessage("Each page needs a URL slug, and “admin” is reserved.");
      return;
    }
    if (new Set(slugs).size !== slugs.length) {
      setErrorMessage("Each page must have a unique URL slug.");
      return;
    }

    if (!supabase && previewMode) {
      try {
        window.localStorage.setItem(localPreviewStorageKey, JSON.stringify(next));
        setContent(next);
        setNotice("Saved in this browser only — not published.");
      } catch (error) {
        console.error("Unable to save the local portfolio preview:", error);
        setErrorMessage("Couldn’t save the local preview. Check your browser storage and try again.");
      }
      return;
    }
    if (!supabase) return;
    setBusy(true);
    setErrorMessage("");
    const { error } = await supabase
      .from("portfolio_content")
      .upsert({ id: "primary", data: next }, { onConflict: "id" });
    if (error) {
      setErrorMessage(error.message);
    } else {
      setContent(next);
      setNotice("Changes saved and published.");
      window.setTimeout(() => setNotice(""), 4000);
    }
    setBusy(false);
  }

  function startLocalPreview() {
    let storageWarning = "";
    try {
      const savedContent = window.localStorage.getItem(localPreviewStorageKey);
      if (savedContent) {
        const parsed: unknown = JSON.parse(savedContent);
        setContent(isPortfolioContent(parsed) ? parsed : starterContent);
      }
    } catch (error) {
      console.error("Unable to restore the local portfolio preview:", error);
      storageWarning = "Couldn’t restore your saved preview. Starting with sample content.";
      setContent(starterContent);
    }
    setErrorMessage(storageWarning);
    setPreviewMode(true);
    setAuthenticated(true);
  }

  function updateSettings(field: keyof PortfolioContent["settings"], value: string) {
    setContent((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: value,
      },
    }));
  }

  function updateSocial(index: number, field: "label" | "href", value: string) {
    setContent((current) => ({
      ...current,
      settings: {
        ...current.settings,
        social: current.settings.social.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function addSocial() {
    setContent((current) => ({
      ...current,
      settings: {
        ...current.settings,
        social: [...current.settings.social, { label: "", href: "" }],
      },
    }));
  }

  function removeSocial(index: number) {
    setContent((current) => ({
      ...current,
      settings: {
        ...current.settings,
        social: current.settings.social.filter((_item, itemIndex) => itemIndex !== index),
      },
    }));
  }

  function updatePage(pageId: string, updates: Partial<PortfolioPage>) {
    setContent((current) => ({
      ...current,
      pages: current.pages.map((page) => page.id === pageId ? { ...page, ...updates } : page),
    }));
  }

  function addPage() {
    const page: PortfolioPage = {
      id: crypto.randomUUID(),
      slug: "new-page",
      title: "New page",
      navLabel: "New page",
      eyebrow: "A NEW CHAPTER",
      description: "A short introduction to this page.",
      kind: "cards",
      entries: [],
    };
    setContent((current) => ({ ...current, pages: [...current.pages, page] }));
    setSelectedPageId(page.id);
    setSection("pages");
  }

  function deletePage(pageId: string) {
    const page = content.pages.find((item) => item.id === pageId);
    if (!page || !window.confirm(`Delete “${page.title}” and all its entries?`)) return;
    setContent((current) => ({ ...current, pages: current.pages.filter((item) => item.id !== pageId) }));
    setSelectedPageId(null);
  }

  function updateEntry(pageId: string, index: number, field: keyof PortfolioEntry, value: string) {
    const page = content.pages.find((item) => item.id === pageId);
    if (!page) return;
    const entries = page.entries.map((entry, itemIndex) =>
      itemIndex === index ? { ...entry, [field]: value } : entry,
    );
    updatePage(pageId, { entries });
  }

  function addEntry(pageId: string) {
    const page = content.pages.find((item) => item.id === pageId);
    if (!page) return;
    updatePage(pageId, {
      entries: [...page.entries, { title: "", meta: "", description: "", href: "" }],
    });
  }

  function removeEntry(pageId: string, index: number) {
    const page = content.pages.find((item) => item.id === pageId);
    if (!page) return;
    updatePage(pageId, { entries: page.entries.filter((_entry, itemIndex) => itemIndex !== index) });
  }

  if (!ready) {
    return <div className="admin-loading"><LoaderCircle className="spin" size={20} /> Loading admin…</div>;
  }

  if (!hasSupabaseConfig && !previewMode) {
    return (
      <main className="setup-screen">
        <Link href="/" className="setup-back"><ArrowLeft size={15} /> Return to portfolio</Link>
        <div className="setup-card">
          <span className="setup-icon"><Settings size={21} /></span>
          <span className="admin-kicker">ONE LAST CONNECTION</span>
          <h1>Connect your portfolio.</h1>
          <p>The site is ready. Add your Supabase project keys to Vercel to turn on secure sign-in and live content editing.</p>
          <ol>
            <li>Create a Supabase project and run <code>supabase/schema.sql</code>.</li>
            <li>Set the two <code>NEXT_PUBLIC_SUPABASE_…</code> keys, <code>SUPABASE_SECRET_KEY</code>, and a one-time <code>PORTFOLIO_ADMIN_SETUP_CODE</code> in Vercel.</li>
            <li>Redeploy, visit <code>/admin</code>, and choose <strong>Create first admin account</strong>.</li>
            <li>After registration, remove the two server-only setup keys from Vercel.</li>
          </ol>
          <span className="setup-safe"><Check size={15} /> Admin changes are protected by Supabase row-level security.</span>
          {process.env.NODE_ENV === "development" && (
            <div className="local-preview-setup">
              <span><strong>Explore the CMS</strong><small>Try the content editor with sample data saved only in this browser.</small></span>
              <button className="button button-dark" onClick={startLocalPreview}>Preview admin <ArrowUpRight size={15} /></button>
              <small className="preview-disclaimer">Demo only. No login, remote connection, or publishing.</small>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-login">
        <section className="login-story">
          <Link className="login-brand" href="/">
            <span className="login-brand-mark">J</span>
            <span>Janak<small>ACADEMIC PORTFOLIO</small></span>
          </Link>
          <div className="login-story-copy">
            <span className="login-overline">JANAK / PRIVATE OFFICE</span>
            <span className="login-watermark" aria-hidden="true">J</span>
            <h1>Every idea,<br />in its right place.</h1>
            <p>One calm workspace for research, teaching, publications, and the details that bring them together.</p>
          </div>
          <div className="login-story-footer"><span>CONTENT STUDIO</span><span><i /> OWNER ACCESS ONLY</span></div>
        </section>
        <section className="login-stage">
          <div className="login-card">
            <div className="login-card-top"><span>PRIVATE WORKSPACE</span><span><ShieldCheck size={14} /> SECURE LOGIN</span></div>
            <div className="login-monogram">J</div>
            <h2>{registrationMode ? "Set up your account." : <>One secure sign-in.<br /><em>Your work, in order.</em></>}</h2>
            <p className="login-description">{registrationMode ? "Create the owner account to manage Janak’s academic portfolio." : "Sign in to edit pages, update your profile, and publish new work."}</p>
            <form onSubmit={registrationMode ? registerAdmin : signIn}>
              <label htmlFor="admin-email">Email address</label>
              <input id="admin-email" type="email" autoComplete="username" placeholder="you@example.com" required value={email} onChange={(event) => { setEmail(event.target.value); setResetSent(false); }} />
              {registrationMode && (
                <>
                  <label htmlFor="admin-setup-code">One-time setup code</label>
                  <input id="admin-setup-code" type="password" autoComplete="off" placeholder="Enter your private setup code" required value={setupCode} onChange={(event) => setSetupCode(event.target.value)} />
                </>
              )}
              <div className="login-password-label"><label htmlFor="admin-password">Password</label>{!registrationMode && <button type="button" onClick={() => void sendPasswordReset()} disabled={busy}>Forgot password?</button>}</div>
              <input id="admin-password" type="password" autoComplete={registrationMode ? "new-password" : "current-password"} minLength={registrationMode ? 12 : undefined} placeholder={registrationMode ? "At least 12 characters" : "Enter your password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
              {registrationMode && (
                <>
                  <label htmlFor="admin-confirm-password">Confirm password</label>
                  <input id="admin-confirm-password" type="password" autoComplete="new-password" minLength={12} placeholder="Enter your password again" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </>
              )}
              {errorMessage && <div className="admin-error" role="alert">{errorMessage}</div>}
              {resetSent && <div className="login-success" role="status"><Check size={15} /> Password reset instructions were sent to your email.</div>}
              <button className="button button-dark login-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : registrationMode ? "Create owner account" : "Sign in to your studio"} {busy ? null : <MoveRight size={16} />}</button>
            </form>
            {registrationAvailable && (
              <button className="registration-toggle" onClick={() => { setRegistrationMode(!registrationMode); setErrorMessage(""); setResetSent(false); }}>
                {registrationMode ? "Already set up? Sign in" : "First time here? Create first admin account"}
              </button>
            )}
            <div className="login-security"><LockKeyhole size={15} /><span><strong>Owner-only editing.</strong> Page changes and site settings are protected. Public visitors cannot enter the CMS.</span></div>
            <div className="login-card-footer"><Link href="/"><ArrowLeft size={13} /> View public portfolio</Link><span>{registrationMode ? "FIRST OWNER SETUP" : "ONE OWNER LOGIN"}</span></div>
          </div>
        </section>
      </main>
    );
  }

  const activePage = content.pages.find((page) => page.id === selectedPageId);

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="wordmark admin-wordmark" href="/">
          <span className="wordmark-symbol">J</span>
          <span>J<span className="admin-brand-sub">PORTFOLIO STUDIO</span></span>
        </Link>
        <span className="sidebar-label">WORKSPACE</span>
        <button className={`sidebar-item ${section === "overview" ? "selected" : ""}`} onClick={() => { setSection("overview"); setSelectedPageId(null); }}><LayoutDashboard size={17} /> Overview</button>
        <button className={`sidebar-item ${section === "pages" ? "selected" : ""}`} onClick={() => { setSection("pages"); setSelectedPageId(null); }}><FileText size={17} /> Pages <span className="sidebar-count">{content.pages.length}</span></button>
        <button className={`sidebar-item ${section === "profile" ? "selected" : ""}`} onClick={() => { setSection("profile"); setSelectedPageId(null); }}><UserRound size={17} /> Profile</button>
        <div className="sidebar-bottom">
          <Link className="sidebar-preview" href="/" target="_blank">View live site <ArrowUpRight size={14} /></Link>
          <button className="sidebar-item signout" onClick={signOut}><LogOut size={16} /> {previewMode ? "Exit preview" : "Sign out"}</button>
          <span className="sidebar-user"><span className="user-avatar">{previewMode ? "P" : email.charAt(0).toUpperCase()}</span><span>{previewMode ? "Local preview" : email}<small>{previewMode ? "DEMO ONLY" : "ADMINISTRATOR"}</small></span><ChevronDown size={14} /></span>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><span>PORTFOLIO STUDIO</span><span className="crumb-divider">/</span><strong>{activePage ? activePage.title : section === "overview" ? "Overview" : section === "pages" ? "Pages" : "Profile"}</strong></div>
          {notice && <span className="save-notice"><Check size={14} /> {notice}</span>}
          <Link href="/" target="_blank" className="topbar-link">Preview site <ArrowUpRight size={14} /></Link>
        </header>
        <div className="admin-content">
          {previewMode && <div className="preview-banner"><CircleHelp size={16} /><span><strong>Local preview mode</strong> Edits are saved only in this browser. They are not published to Janak’s live site.</span><button onClick={signOut}>Exit preview</button></div>}
          {errorMessage && <div className="admin-error banner">{errorMessage}</div>}
          {section === "overview" && (
            <Overview content={content} onPages={() => setSection("pages")} onProfile={() => setSection("profile")} onAddPage={addPage} />
          )}
          {section === "profile" && (
            <section className="editor-view">
              <div className="editor-title"><div><span className="admin-kicker">YOUR DETAILS</span><h1>Profile & introduction</h1><p>This is the first thing visitors learn about you.</p></div><button className="button button-dark" onClick={() => void saveContent(content)} disabled={busy}><Save size={15} /> Save changes</button></div>
              <div className="editor-panel">
                <div className="panel-heading"><UserRound size={17} /><div><strong>About you</strong><span>Name, role, and the small details.</span></div></div>
                <div className="form-grid">
                  <label>Display name<input value={content.settings.name} onChange={(event) => updateSettings("name", event.target.value)} /></label>
                  <label>Monogram<input maxLength={3} value={content.settings.initials} onChange={(event) => updateSettings("initials", event.target.value)} /></label>
                  <label>Role or tagline<input value={content.settings.role} onChange={(event) => updateSettings("role", event.target.value)} /></label>
                  <label>Location<input value={content.settings.location} onChange={(event) => updateSettings("location", event.target.value)} /></label>
                  <label>Email address<input type="email" value={content.settings.email} onChange={(event) => updateSettings("email", event.target.value)} /></label>
                  <label>Availability<input value={content.settings.availability} onChange={(event) => updateSettings("availability", event.target.value)} /></label>
                  <label className="full-field">Introduction<textarea rows={3} value={content.settings.introduction} onChange={(event) => updateSettings("introduction", event.target.value)} /></label>
                  <label className="full-field">About<textarea rows={5} value={content.settings.about} onChange={(event) => updateSettings("about", event.target.value)} /></label>
                </div>
                <div className="social-editor">
                  <div className="social-editor-heading"><div><strong>Social links</strong><span>Add links to your academic profiles or other websites.</span></div><button className="small-add" onClick={addSocial}><Plus size={14} /> Add link</button></div>
                  {content.settings.social.map((item, index) => (
                    <div className="social-edit-row" key={`social-${index}`}>
                      <label>Label<input value={item.label} onChange={(event) => updateSocial(index, "label", event.target.value)} placeholder="e.g. Google Scholar" /></label>
                      <label>URL<input value={item.href} onChange={(event) => updateSocial(index, "href", event.target.value)} placeholder="https://…" /></label>
                      <button onClick={() => removeSocial(index)} aria-label="Remove social link"><Trash2 size={15} /></button>
                    </div>
                  ))}
                  {content.settings.social.length === 0 && <p className="social-empty">No social links yet. Add any profiles you’d like visitors to find.</p>}
                </div>
              </div>
            </section>
          )}
          {section === "pages" && !activePage && (
            <section className="editor-view">
              <div className="editor-title"><div><span className="admin-kicker">YOUR CONTENT</span><h1>Pages</h1><p>Create and manage the chapters of your portfolio.</p></div><button className="button button-dark" onClick={addPage}><Plus size={16} /> Add a page</button></div>
              <div className="page-manager">
                {content.pages.map((page, index) => (
                  <button className="managed-page" key={page.id} onClick={() => setSelectedPageId(page.id)}>
                    <span className="managed-page-icon">{page.kind === "timeline" ? <BookOpen size={18} /> : <FileText size={18} />}</span>
                    <span className="managed-page-name"><strong>{page.title}</strong><small>/{page.slug} · {page.entries.length} {page.entries.length === 1 ? "entry" : "entries"}</small></span>
                    <span className="managed-page-number">{String(index + 1).padStart(2, "0")}</span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
                <button className="add-page-row" onClick={addPage}><FilePlus2 size={17} /> Add another page <Plus size={15} /></button>
              </div>
            </section>
          )}
          {section === "pages" && activePage && (
            <section className="editor-view">
              <button className="back-to-pages" onClick={() => setSelectedPageId(null)}><ArrowLeft size={14} /> All pages</button>
              <div className="editor-title"><div><span className="admin-kicker">EDIT PAGE</span><h1>{activePage.title}</h1><p>{previewMode ? "Preview edits stay in this browser and are not published." : "Changes appear on your public site when saved."}</p></div><button className="button button-dark" onClick={() => void saveContent(content)} disabled={busy}><Save size={15} /> Save changes</button></div>
              <div className="editor-panel">
                <div className="panel-heading"><FileText size={17} /><div><strong>Page details</strong><span>Title, link, and introduction.</span></div></div>
                <div className="form-grid">
                  <label>Page title<input value={activePage.title} onChange={(event) => updatePage(activePage.id, { title: event.target.value })} /></label>
                  <label>Navigation label<input value={activePage.navLabel} onChange={(event) => updatePage(activePage.id, { navLabel: event.target.value })} /></label>
                  <label>Page address<input value={activePage.slug} onChange={(event) => updatePage(activePage.id, { slug: normalizeSlug(event.target.value) })} /><small className="field-hint">Your page will be at /{activePage.slug || "your-page"}</small></label>
                  <label>Page style<select value={activePage.kind} onChange={(event) => updatePage(activePage.id, { kind: event.target.value as PortfolioPage["kind"] })}><option value="cards">Cards</option><option value="timeline">Timeline</option><option value="prose">Editorial</option><option value="links">Links</option></select></label>
                  <label>Eyebrow<input value={activePage.eyebrow} onChange={(event) => updatePage(activePage.id, { eyebrow: event.target.value })} /></label>
                  <label>Short introduction<input value={activePage.description} onChange={(event) => updatePage(activePage.id, { description: event.target.value })} /></label>
                </div>
              </div>
              <div className="editor-panel entries-panel">
                <div className="panel-heading"><BookOpen size={17} /><div><strong>Page entries</strong><span>Add as many roles, articles, or links as you like.</span></div><button className="small-add" onClick={() => addEntry(activePage.id)}><Plus size={14} /> Add entry</button></div>
                {activePage.entries.map((entry, index) => (
                  <div className="entry-editor" key={`${activePage.id}-${index}`}>
                    <div className="entry-editor-title"><span>ENTRY {String(index + 1).padStart(2, "0")}</span><button onClick={() => removeEntry(activePage.id, index)} aria-label="Delete entry"><Trash2 size={15} /></button></div>
                    <div className="form-grid">
                      <label>Title<input value={entry.title} onChange={(event) => updateEntry(activePage.id, index, "title", event.target.value)} /></label>
                      <label>Date, type, or context<input value={entry.meta} onChange={(event) => updateEntry(activePage.id, index, "meta", event.target.value)} /></label>
                      <label className="full-field">Description<textarea rows={3} value={entry.description} onChange={(event) => updateEntry(activePage.id, index, "description", event.target.value)} /></label>
                      <label className="full-field">Link (optional)<input type="url" placeholder="https://" value={entry.href} onChange={(event) => updateEntry(activePage.id, index, "href", event.target.value)} /></label>
                    </div>
                  </div>
                ))}
                {activePage.entries.length === 0 && <div className="entries-empty"><BookOpen size={21} /><p>This page is ready for its first entry.</p><button onClick={() => addEntry(activePage.id)}>Add an entry <Plus size={14} /></button></div>}
              </div>
              <button className="delete-page" onClick={() => deletePage(activePage.id)}><Trash2 size={15} /> Delete this page</button>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function Overview({
  content,
  onPages,
  onProfile,
  onAddPage,
}: {
  content: PortfolioContent;
  onPages: () => void;
  onProfile: () => void;
  onAddPage: () => void;
}) {
  return (
    <section className="editor-view">
      <div className="welcome-banner">
        <div><span className="admin-kicker">YOUR PORTFOLIO, YOUR WAY</span><h1>Good to see you, {content.settings.name}.</h1><p>Small edits, new ideas, a whole new chapter. It’s all yours to shape.</p></div>
        <div className="welcome-sparkle"><BookOpen size={29} strokeWidth={1.25} /></div>
      </div>
      <div className="stats-row">
        <div className="stat-card"><span>PUBLISHED PAGES</span><strong>{String(content.pages.length).padStart(2, "0")}</strong><small>in your portfolio</small></div>
        <div className="stat-card"><span>CONTENT ENTRIES</span><strong>{String(content.pages.reduce((total, page) => total + page.entries.length, 0)).padStart(2, "0")}</strong><small>across every page</small></div>
        <Link href="/" target="_blank" className="stat-card stat-link"><span>YOUR PUBLIC SITE</span><strong><ArrowUpRight size={22} /></strong><small>See what visitors see</small></Link>
      </div>
      <div className="overview-lower">
        <div className="editor-panel quick-actions">
          <div className="panel-heading"><LayoutDashboard size={17} /><div><strong>Quick actions</strong><span>Pick up where you left off.</span></div></div>
          <button onClick={onPages}><FileText size={16} /><span>Manage your pages</span><ArrowUpRight size={15} /></button>
          <button onClick={onProfile}><UserRound size={16} /><span>Update your profile</span><ArrowUpRight size={15} /></button>
          <button onClick={onAddPage}><Plus size={16} /><span>Create a new page</span><ArrowUpRight size={15} /></button>
        </div>
        <div className="editor-panel recent-pages">
          <div className="panel-heading"><BookOpen size={17} /><div><strong>Your pages</strong><span>Recently in your portfolio.</span></div></div>
          {content.pages.slice(0, 4).map((page) => (
            <button key={page.id} onClick={onPages}><span>{page.navLabel}</span><small>/{page.slug}</small><ArrowUpRight size={14} /></button>
          ))}
        </div>
      </div>
    </section>
  );
}
