import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseServerConfig = Boolean(url && anonKey);

export type AdminAccess =
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "admin"; email: string }
  | { status: "unauthorized" }
  | { status: "error" };

export async function getAdminAccess(): Promise<AdminAccess> {
  if (!url || !anonKey) return { status: "unconfigured" };

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; the Proxy refreshes sessions.
        }
      },
    },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Unable to verify the admin session:", userError.message);
    return { status: "error" };
  }
  if (!user) return { status: "unauthenticated" };

  const { data, error } = await supabase
    .from("portfolio_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Unable to verify portfolio administrator access:", error.message);
    return { status: "error" };
  }
  if (!data) return { status: "unauthorized" };

  return { status: "admin", email: user.email ?? "" };
}
