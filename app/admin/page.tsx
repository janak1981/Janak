import { AdminApp } from "./admin-app";
import { getAdminAccess } from "@/lib/supabase-server";

export const metadata = { title: "Portfolio admin" };

export default async function AdminPage() {
  const access = await getAdminAccess();

  if (access.status === "unauthorized" || access.status === "error") {
    return (
      <main className="setup-screen">
        <section className="setup-card">
          <span className="setup-icon"><span aria-hidden="true">!</span></span>
          <span className="admin-kicker">PRIVATE WORKSPACE</span>
          <h1>Administrator access required.</h1>
          <p>This account is not authorized to manage this portfolio. Sign in with the first owner account or return to the setup guide.</p>
          <a className="setup-guide-link" href="/admin/setup">Open the secure setup guide</a>
        </section>
      </main>
    );
  }

  return <AdminApp initialAdminEmail={access.status === "admin" ? access.email : ""} />;
}
