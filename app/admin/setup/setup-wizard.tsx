"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Circle,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type SetupStatus = {
  checks: {
    publicConfig: boolean;
    ownerEmail: boolean;
    bootstrapSecrets: boolean;
    adminTableReachable: boolean | null;
  };
  ready: boolean;
  adminExists: boolean | null;
};

const checkLabels: Record<keyof SetupStatus["checks"], string> = {
  publicConfig: "Supabase project URL and public key",
  ownerEmail: "Owner email is configured",
  bootstrapSecrets: "One-time server setup is configured",
  adminTableReachable: "Portfolio admin table is reachable",
};

export function SetupWizard() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);

  const refreshStatus = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/admin/setup-status", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Setup status could not be checked.");
      setStatus(await response.json() as SetupStatus);
    } catch {
      setError("Could not check setup right now. Confirm the site is online and try again.");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function createOwner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, setupCode }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        const message = result.error ?? "Owner account could not be created.";
        await refreshStatus();
        setError(message);
        return;
      }
      setCreated(true);
      setPassword("");
      setConfirmPassword("");
      setSetupCode("");
      await refreshStatus();
    } catch {
      setError("Could not reach the setup service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const checks = status?.checks;
  const setupBlocked = !status?.ready || checking;

  return (
    <section className="setup-wizard" aria-labelledby="setup-wizard-title">
      <div className="setup-wizard-heading">
        <div>
          <span className="admin-kicker">FIRST-RUN CHECKLIST</span>
          <h2 id="setup-wizard-title">Create the owner account</h2>
          <p>This account can be created only once. The checks below never reveal secret values.</p>
        </div>
        <button
          className="setup-refresh"
          type="button"
          onClick={() => void refreshStatus()}
          disabled={checking}
          aria-label="Recheck setup status"
        >
          {checking ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />}
          {checking ? "Checking" : "Recheck"}
        </button>
      </div>

      <div className="setup-checklist" aria-live="polite">
        {(Object.keys(checkLabels) as Array<keyof SetupStatus["checks"]>).map((key) => {
          const value = checks?.[key];
          const done = value === true;
          const waitingForConfig = value === null;
          return (
            <div className={`setup-check ${done ? "done" : ""}`} key={key}>
              {done ? <Check size={15} /> : <Circle size={15} />}
              <span>{checkLabels[key]}</span>
              <small>
                {checking || !status
                  ? "Checking"
                  : done
                    ? "Ready"
                    : waitingForConfig
                      ? "Waiting for configuration"
                      : "Action needed"}
              </small>
            </div>
          );
        })}
      </div>

      {error && <div className="setup-wizard-error" role="alert"><AlertCircle size={15} />{error}</div>}

      {status?.adminExists && (
        <div className="setup-wizard-success" role="status">
          <ShieldCheck size={18} />
          <span><strong>Owner account already exists.</strong> One-time setup is closed. Sign in to manage the site.</span>
          <Link href="/admin">Go to sign in</Link>
        </div>
      )}

      {created && !status?.adminExists && (
        <div className="setup-wizard-success" role="status">
          <Check size={18} />
          <span><strong>Owner account created.</strong> Sign in with the email and password you just set.</span>
          <Link href="/admin">Go to sign in</Link>
        </div>
      )}

      {!status?.adminExists && !created && (
        <>
          {!status?.ready && (
            <div className="setup-wizard-next">
              <strong>Finish the items marked “Action needed.”</strong>
              <span>Use the setup guide below to configure Supabase, run the schema, and add the required Production environment variables in Vercel. Then recheck this page.</span>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                Open Supabase dashboard <ExternalLink size={13} />
              </a>
              <a href="https://vercel.com/janak14/janak/settings/environment-variables" target="_blank" rel="noreferrer">
                Open Janak’s Vercel settings <ExternalLink size={13} />
              </a>
            </div>
          )}

          {status?.ready && (
            <form className="setup-owner-form" onSubmit={createOwner}>
              <label>
                Owner email
                <input
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                One-time setup code
                <input
                  type="password"
                  autoComplete="off"
                  required
                  maxLength={256}
                  value={setupCode}
                  onChange={(event) => setSetupCode(event.target.value)}
                />
              </label>
              <label>
                New password <small>At least 12 characters</small>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
              <p className="setup-form-safety"><ShieldCheck size={14} /> Values are sent securely to the one-time setup endpoint and are not saved in this browser.</p>
              <button className="studio-setup-primary" type="submit" disabled={setupBlocked || busy}>
                {busy ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />}
                {busy ? "Creating owner account…" : checking ? "Checking setup…" : "Create the one-time owner account"}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
