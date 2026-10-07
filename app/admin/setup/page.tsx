import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ExternalLink,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Admin setup | Janak Studio",
  robots: { index: false, follow: false },
};

const environmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "PORTFOLIO_ADMIN_SETUP_CODE",
];

export default function AdminSetupPage() {
  return (
    <main className="setup-screen studio-setup-screen">
      <Link href="/admin" className="setup-back"><ArrowLeft size={15} /> Back to admin</Link>
      <div className="studio-setup-wrap">
        <header className="studio-setup-brand">
          <span className="studio-brand-mark">J</span>
          <span><strong>JANAK STUDIO</strong><small>SECURE ADMIN SETUP</small></span>
        </header>

        <section className="studio-setup-card">
          <div className="studio-setup-heading">
            <span className="setup-icon"><LockKeyhole size={20} /></span>
            <span className="admin-kicker">ONE-TIME CONNECTION</span>
            <h1>Connect your website.</h1>
            <p>Complete these steps in your own Supabase and Vercel dashboards. This guide never asks you to paste credentials or passwords into this page.</p>
          </div>

          <ol className="studio-setup-steps">
            <li>
              <span className="studio-setup-step-number">01</span>
              <div>
                <h2>Create your Supabase project</h2>
                <p>Create or open Janak’s project, then copy its project URL and publishable (or anon) key from the Supabase project settings.</p>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <ExternalLink size={13} /></a>
              </div>
            </li>
            <li>
              <span className="studio-setup-step-number">02</span>
              <div>
                <h2>Prepare the portfolio database</h2>
                <p>In the Supabase SQL Editor, run the repository schema file <code>supabase/schema.sql</code>. It creates the content tables, access policies, and one-time admin claim function.</p>
                <span className="studio-setup-note"><ShieldCheck size={14} /> Keep public sign-ups disabled. The first owner is created through the protected setup flow.</span>
              </div>
            </li>
            <li>
              <span className="studio-setup-step-number">03</span>
              <div>
                <h2>Add the server and browser settings to Vercel</h2>
                <p>Open the Janak project’s environment settings and add these names for Production. Use the Supabase URL/key and a server-only Supabase secret key. Generate the one-time setup code locally with <code>openssl rand -hex 32</code>.</p>
                <div className="studio-env-list" aria-label="Required environment variable names">
                  {environmentVariables.map((name) => <code key={name}>{name}</code>)}
                </div>
                <span className="studio-setup-note"><LockKeyhole size={14} /> Never prefix the Supabase secret or setup code with <code>NEXT_PUBLIC_</code>. Never put their values in source code, a browser form, or chat.</span>
                <a href="https://vercel.com/janak14/janak/settings/environment-variables" target="_blank" rel="noreferrer">Open Janak’s Vercel environment settings <ExternalLink size={13} /></a>
              </div>
            </li>
            <li>
              <span className="studio-setup-step-number">04</span>
              <div>
                <h2>Redeploy, then create the owner account</h2>
                <p>Redeploy after saving the variables. Return here and open the admin page; the first-admin option appears when the server setup is ready. Enter the owner email, a new unique password, and the one-time setup code directly in the secure form.</p>
                <Link href="/admin" className="studio-setup-primary">Continue to secure admin setup <ArrowUpRight size={15} /></Link>
              </div>
            </li>
            <li>
              <span className="studio-setup-step-number">05</span>
              <div>
                <h2>Close the bootstrap window</h2>
                <p>After the first admin account is created, remove <code>SUPABASE_SECRET_KEY</code> and <code>PORTFOLIO_ADMIN_SETUP_CODE</code> from Vercel and redeploy. These bootstrap secrets are not needed for regular sign-in or editing.</p>
                <span className="studio-setup-note"><Check size={14} /> Content editing is restricted by Supabase row-level security to registered portfolio admins.</span>
              </div>
            </li>
          </ol>

          <footer className="studio-setup-footer">
            <span>Already connected?</span>
            <Link href="/admin">Return to admin sign-in <ArrowUpRight size={13} /></Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
