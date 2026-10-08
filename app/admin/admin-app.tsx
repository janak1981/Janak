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
  Search,
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
import { hasSupabaseConfig } from "@/lib/supabase";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Section = "overview" | "pages" | "profile";
const localPreviewStorageKey = "janak-portfolio-local-preview";

export function AdminApp({ initialAdminEmail = "" }: { initialAdminEmail?: string }) {
  const [authenticated, setAuthenticated] = useState(Boolean(initialAdminEmail));
  const [previewMode, setPreviewMode] = useState(false);
  const [email, setEmail] = useState(initialAdminEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [registrationAvailable, setRegistrationAvailable] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [content, setContent] = useState<PortfolioContent>(starterContent);
  const [section, setSection] = useState<Section>("overview");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(!hasSupabaseConfig);

  async function verifyAdminSession(userId: string, userEmail: string) {
    if (!supabaseBrowser) return;
    const { data, error } = await supabaseBrowser
      .from("portfolio_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setAuthenticated(false);
      setErrorMessage("Unable to verify administrator access. Confirm the Supabase schema is installed, then try again.");
      setReady(true);
      return;
    }
    if (!data) {
      setAuthenticated(false);
      setErrorMessage("This account is not authorized to manage the portfolio.");
      setReady(true);
      return;
    }

    setEmail(userEmail);
    setAuthenticated(true);
    setErrorMessage("");
    setReady(true);
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!supabaseBrowser) return;
    let active = true;
    void supabaseBrowser.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setErrorMessage("Unable to check your sign-in session. Please reload and try again.");
        setReady(true);
        return;
      }
      if (data.session) {
        void verifyAdminSession(data.session.user.id, data.session.user.email ?? "");
      } else {
        setAuthenticated(false);
        setReady(true);
      }
    });
    const { data } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false);
        setReady(true);
        return;
      }
      window.setTimeout(() => {
        if (active) void verifyAdminSession(session.user.id, session.user.email ?? "");
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseBrowser || authenticated) return;
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
    if (!authenticated || !supabaseBrowser) return;
    let active = true;
    void supabaseBrowser
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
    if (!supabaseBrowser) return;
    setBusy(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) setErrorMessage(error.message);
      else await verifyAdminSession(data.user.id, data.user.email ?? email);
    } catch (error) {
      console.error("Unable to reach the admin sign-in service:", error);
      setErrorMessage("Unable to reach the sign-in service. Please try again.");
    }
    setBusy(false);
  }

  async function sendPasswordReset() {
    if (!supabaseBrowser || !email) {
      setErrorMessage("Enter your account email first.");
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
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

      if (!supabaseBrowser) {
        setErrorMessage("The administrator account was created, but sign-in is not configured.");
        setBusy(false);
        return;
      }
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      setRegistrationAvailable(false);
      setRegistrationMode(false);
      setPassword("");
      setConfirmPassword("");
      setSetupCode("");
      if (error) {
        setErrorMessage(`Your account was created. Please sign in with your new password: ${error.message}`);
      } else await verifyAdminSession(data.user.id, data.user.email ?? email);
    } catch {
      setErrorMessage("Unable to reach the registration service. Please try again.");
    }
    setBusy(false);
  }

  async function signOut() {
    if (!supabaseBrowser) {
      setAuthenticated(false);
      setPreviewMode(false);
      setNotice("");
      return;
    }
    const { error } = await supabaseBrowser.auth.signOut();
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

    if (!supabaseBrowser && previewMode) {
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
    if (!supabaseBrowser) return;
    setBusy(true);
    setErrorMessage("");
    const { error } = await supabaseBrowser
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
          <Link href="/admin/setup" className="setup-guide-link">Open the guided setup <ArrowUpRight size={15} /></Link>
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
        <Link className="studio-brand" href="/">
          <span className="studio-brand-mark">J</span>
          <span className="studio-brand-name">JANAK<small>WEBSITE STUDIO</small></span>
        </Link>
        <nav className="studio-navigation" aria-label="Admin navigation">
          <div className="studio-nav-group">
            <span className="sidebar-label">WORKSPACE</span>
            <button className={`sidebar-item ${section === "overview" ? "selected" : ""}`} onClick={() => { setSection("overview"); setSelectedPageId(null); }}><LayoutDashboard size={17} /> Overview</button>
          </div>
          <div className="studio-nav-group">
            <span className="sidebar-label">WEBSITE</span>
            <button className={`sidebar-item ${section === "profile" ? "selected" : ""}`} onClick={() => { setSection("profile"); setSelectedPageId(null); }}><UserRound size={17} /> Home</button>
            <button className={`sidebar-item ${section === "pages" && !activePage ? "selected" : ""}`} onClick={() => { setSection("pages"); setSelectedPageId(null); }}><FileText size={17} /> Pages <span className="sidebar-count">{content.pages.length}</span></button>
          </div>
          <div className="studio-nav-group">
            <span className="sidebar-label">CONTENT</span>
            {content.pages.map((page) => (
              <button
                className={`sidebar-item ${activePage?.id === page.id ? "selected" : ""}`}
                key={page.id}
                onClick={() => { setSection("pages"); setSelectedPageId(page.id); }}
              >
                <BookOpen size={16} /> <span className="studio-nav-text">{page.navLabel}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="sidebar-bottom">
          <Link className="sidebar-preview" href="/" target="_blank">View website <ArrowUpRight size={14} /></Link>
          <button className="sidebar-item signout" onClick={signOut}><LogOut size={16} /> {previewMode ? "Exit preview" : "Sign out"}</button>
          <span className="sidebar-user"><span className="user-avatar">{previewMode ? "P" : email.charAt(0).toUpperCase()}</span><span>{previewMode ? "Local preview" : email}<small>{previewMode ? "DEMO ONLY" : "ADMINISTRATOR"}</small></span><ChevronDown size={14} /></span>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><span>JANAK STUDIO</span><span className="crumb-divider">/</span><strong>{activePage ? activePage.title : section === "overview" ? "Dashboard" : section === "pages" ? "Pages" : "Homepage"}</strong></div>
          <button className="studio-search-trigger" onClick={() => { setSearchQuery(""); setSearchOpen(true); }} aria-label="Search portfolio content">
            <Search size={14} /><span>Search</span><kbd>⌘K</kbd>
          </button>
          <span className={`studio-status ${previewMode ? "preview" : ""}`}><i />{previewMode ? "Local preview" : "CMS connected"}</span>
          {notice && <span className="save-notice"><Check size={14} /> {notice}</span>}
          <Link href="/" target="_blank" className="topbar-link">View website <ArrowUpRight size={14} /></Link>
        </header>
        <div className="admin-content">
          {previewMode && <div className="preview-banner"><CircleHelp size={16} /><span><strong>Local preview mode</strong> Edits are saved only in this browser. They are not published to Janak’s live site.</span><button onClick={signOut}>Exit preview</button></div>}
          {errorMessage && <div className="admin-error banner">{errorMessage}</div>}
          {section === "overview" && (
            <Overview
              content={content}
              previewMode={previewMode}
              onPages={() => { setSection("pages"); setSelectedPageId(null); }}
              onProfile={() => { setSection("profile"); setSelectedPageId(null); }}
              onAddPage={addPage}
              onSelectPage={(pageId) => { setSection("pages"); setSelectedPageId(pageId); }}
            />
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
      {searchOpen && (
        <CommandPalette
          content={content}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onOpenProfile={() => {
            setSection("profile");
            setSelectedPageId(null);
            setSearchOpen(false);
          }}
          onOpenPages={() => {
            setSection("pages");
            setSelectedPageId(null);
            setSearchOpen(false);
          }}
          onOpenPage={(pageId) => {
            setSection("pages");
            setSelectedPageId(pageId);
            setSearchOpen(false);
          }}
          onAddPage={() => {
            setSearchOpen(false);
            addPage();
          }}
        />
      )}
    </main>
  );
}

function CommandPalette({
  content,
  query,
  onQueryChange,
  onClose,
  onOpenProfile,
  onOpenPages,
  onOpenPage,
  onAddPage,
}: {
  content: PortfolioContent;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenPages: () => void;
  onOpenPage: (pageId: string) => void;
  onAddPage: () => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const actions = [
    { id: "profile", label: "Edit homepage profile", detail: "Introduction, contact, and social links", group: "Actions", run: onOpenProfile },
    { id: "pages", label: "Manage all pages", detail: "Browse and edit portfolio pages", group: "Actions", run: onOpenPages },
    { id: "new-page", label: "Create a page", detail: "Add a new portfolio section", group: "Actions", run: onAddPage },
  ];
  const pageResults = content.pages.flatMap((page) => [
    {
      id: `page-${page.id}`,
      label: page.title,
      detail: `/${page.slug}`,
      group: "Pages",
      run: () => onOpenPage(page.id),
    },
    ...page.entries.map((entry, index) => ({
      id: `entry-${page.id}-${index}`,
      label: entry.title || "Untitled entry",
      detail: `In ${page.title}${entry.meta ? ` · ${entry.meta}` : ""}`,
      group: "Entries",
      run: () => onOpenPage(page.id),
    })),
  ]);
  const results = [...actions, ...pageResults]
    .filter((item) => !normalizedQuery || `${item.label} ${item.detail} ${item.group}`.toLowerCase().includes(normalizedQuery))
    .slice(0, 12);

  return (
    <div
      className="studio-command-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="studio-command" role="dialog" aria-modal="true" aria-label="Search portfolio">
        <div className="studio-command-input">
          <Search size={17} />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search pages, entries, or actions…"
            aria-label="Search pages, entries, or actions"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="studio-command-results">
          {results.length === 0 ? (
            <p className="studio-command-empty">No pages or entries match “{query}”.</p>
          ) : results.map((item) => (
            <button key={item.id} onClick={item.run}>
              <span className="studio-command-result-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
              <span className="studio-command-group">{item.group}</span>
            </button>
          ))}
        </div>
        <footer><span>Navigate your workspace</span><span><kbd>⌘</kbd> <kbd>K</kbd> to open <span className="studio-command-separator">·</span> Esc to close</span></footer>
      </section>
    </div>
  );
}

function Overview({
  content,
  previewMode,
  onPages,
  onProfile,
  onAddPage,
  onSelectPage,
}: {
  content: PortfolioContent;
  previewMode: boolean;
  onPages: () => void;
  onProfile: () => void;
  onAddPage: () => void;
  onSelectPage: (pageId: string) => void;
}) {
  return (
    <section className="studio-dashboard">
      <div className="studio-dashboard-heading">
        <div>
          <span className="admin-kicker">YOUR DIGITAL WORKSPACE</span>
          <h1>Welcome back, {content.settings.name}.</h1>
          <p>Your website is ready for its next chapter.</p>
        </div>
        <div className="studio-dashboard-actions">
          <button className="button button-dark" onClick={onAddPage}><Plus size={15} /> Create page</button>
          <Link href="/" target="_blank" className="button button-light">View website <ArrowUpRight size={15} /></Link>
        </div>
      </div>

      <div className={`studio-live-card ${previewMode ? "is-preview" : ""}`}>
        <span className="studio-live-indicator"><i /></span>
        <div><strong>{previewMode ? "Local preview mode" : "Your CMS is connected"}</strong><span>{previewMode ? "Edits are saved in this browser only and are not published." : "Your saved portfolio changes are published to the website."}</span></div>
        <span className="studio-live-label">{previewMode ? "PREVIEW" : "READY"}</span>
      </div>

      <div className="studio-stats">
        <div className="studio-stat"><span>CONTENT PAGES</span><strong>{String(content.pages.length).padStart(2, "0")}</strong><small>in your website</small></div>
        <div className="studio-stat"><span>PORTFOLIO ENTRIES</span><strong>{String(content.pages.reduce((total, page) => total + page.entries.length, 0)).padStart(2, "0")}</strong><small>across all pages</small></div>
        <div className="studio-stat"><span>SOCIAL PROFILES</span><strong>{String(content.settings.social.length).padStart(2, "0")}</strong><small>linked from your profile</small></div>
      </div>

      <div className="studio-dashboard-grid">
        <section className="studio-card studio-quick-card">
          <div className="studio-card-heading"><div><span className="admin-kicker">GET SOMETHING DONE</span><h2>Quick actions</h2></div></div>
          <button onClick={onAddPage}><span className="studio-action-icon"><Plus size={16} /></span><span><strong>Create a page</strong><small>Add a new section to your portfolio</small></span><ArrowUpRight size={15} /></button>
          <button onClick={onProfile}><span className="studio-action-icon"><UserRound size={16} /></span><span><strong>Update homepage</strong><small>Edit your introduction and contact details</small></span><ArrowUpRight size={15} /></button>
          <button onClick={onPages}><span className="studio-action-icon"><FileText size={16} /></span><span><strong>Manage pages</strong><small>Organize your portfolio sections</small></span><ArrowUpRight size={15} /></button>
        </section>
        <section className="studio-card studio-pages-card">
          <div className="studio-card-heading">
            <div><span className="admin-kicker">YOUR WEBSITE</span><h2>Content pages</h2></div>
            <button className="studio-text-action" onClick={onPages}>Manage <ArrowUpRight size={13} /></button>
          </div>
          <div className="studio-page-list">
            {content.pages.map((page) => (
              <button key={page.id} onClick={() => onSelectPage(page.id)}>
                <span className="studio-page-icon"><BookOpen size={16} /></span>
                <span><strong>{page.navLabel}</strong><small>/{page.slug}</small></span>
                <span className="studio-page-count">{page.entries.length} {page.entries.length === 1 ? "entry" : "entries"}</span>
                <ArrowUpRight size={14} />
              </button>
            ))}
            {content.pages.length === 0 && <p className="studio-empty">Create your first page to start shaping your website.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
