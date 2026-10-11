import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function isFirstAdminAvailable() {
  const client = getAdminClient();
  const setupCode = process.env.PORTFOLIO_ADMIN_SETUP_CODE;
  const allowedEmail = process.env.PORTFOLIO_ADMIN_EMAIL?.trim().toLowerCase();
  if (!client || !setupCode || setupCode.length < 32 || !allowedEmail) return false;

  const { count, error } = await client
    .from("portfolio_admins")
    .select("user_id", { count: "exact", head: true });

  if (error) throw new Error(`Unable to check admin registration: ${error.message}`);
  return count === 0;
}

export async function GET() {
  try {
    return Response.json(
      { available: await isFirstAdminAvailable() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to check first-admin registration:", error);
    return Response.json({ error: "Admin registration is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "A valid registration request is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "A valid registration request is required." }, { status: 400 });
  }

  const { email, password, setupCode } = body as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128 ||
    typeof setupCode !== "string" ||
    setupCode.length > 256
  ) {
    return Response.json(
      { error: "Enter a valid email, a password with at least 12 characters, and your setup code." },
      { status: 400 },
    );
  }

  const expectedCode = process.env.PORTFOLIO_ADMIN_SETUP_CODE;
  const allowedEmail = process.env.PORTFOLIO_ADMIN_EMAIL?.trim().toLowerCase();
  const client = getAdminClient();
  if (!expectedCode || expectedCode.length < 32 || !allowedEmail || !client) {
    return Response.json({ error: "Admin registration has not been configured on the server." }, { status: 503 });
  }
  if (email.trim().toLowerCase() !== allowedEmail) {
    return Response.json({ error: "Admin registration is restricted to the configured owner email." }, { status: 403 });
  }

  const submitted = Buffer.from(setupCode);
  const expected = Buffer.from(expectedCode);
  if (submitted.length !== expected.length || !timingSafeEqual(submitted, expected)) {
    return Response.json({ error: "The setup code is incorrect." }, { status: 401 });
  }

  try {
    if (!(await isFirstAdminAvailable())) {
      return Response.json({ error: "The initial administrator has already been registered." }, { status: 409 });
    }

    const { data, error } = await client.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const { data: claimed, error: claimError } = await client.rpc(
      "claim_first_portfolio_admin",
      { target_user_id: data.user.id },
    );

    if (claimError || claimed !== true) {
      const { error: cleanupError } = await client.auth.admin.deleteUser(data.user.id);
      if (cleanupError) {
        console.error("Unable to remove unclaimed admin account:", cleanupError.message);
      }
      if (claimError) {
        console.error("Unable to claim first admin account:", claimError.message);
      }
      return Response.json(
        { error: claimError ? "Unable to finish admin registration. Please try again." : "The initial administrator has already been registered." },
        { status: claimError ? 500 : 409 },
      );
    }

    return Response.json({ created: true }, { status: 201 });
  } catch (error) {
    console.error("First-admin registration failed:", error);
    return Response.json({ error: "Unable to finish admin registration. Please try again." }, { status: 500 });
  }
}
