"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function SetupAccessMessage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (!supabaseBrowser) return;
    setBusy(true);
    const { error } = await supabaseBrowser.auth.signOut();
    if (error) {
      setMessage("Unable to sign out. Clear this site’s saved session, then sign in with the portfolio owner account.");
      setBusy(false);
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <div className="studio-setup-access-message" role="alert">
      <strong>This account does not have portfolio administrator access.</strong>
      <span>Sign out, then sign in using the owner account that was registered for this website.</span>
      <button type="button" onClick={() => void signOut()} disabled={busy}>
        <LogOut size={14} /> {busy ? "Signing out…" : "Sign out"}
      </button>
      {message && <span>{message}</span>}
    </div>
  );
}
