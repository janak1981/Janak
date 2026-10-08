import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const publicConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const ownerEmail = Boolean(process.env.PORTFOLIO_ADMIN_EMAIL?.trim());
  const setupCode = process.env.PORTFOLIO_ADMIN_SETUP_CODE;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bootstrapSecrets = Boolean(
    serviceKey && setupCode && setupCode.length >= 32,
  );

  let adminTableReachable: boolean | null = null;
  let adminExists: boolean | null = null;

  if (publicConfig && bootstrapSecrets) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { count, error } = await client
      .from("portfolio_admins")
      .select("user_id", { count: "exact", head: true });

    if (error) {
      console.error("Unable to check admin setup readiness:", error.message);
      adminTableReachable = false;
    } else {
      adminTableReachable = true;
      adminExists = (count ?? 0) > 0;
    }
  }

  const ready =
    publicConfig &&
    ownerEmail &&
    bootstrapSecrets &&
    adminTableReachable === true &&
    adminExists === false;

  return Response.json(
    {
      checks: { publicConfig, ownerEmail, bootstrapSecrets, adminTableReachable },
      ready,
      adminExists,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
