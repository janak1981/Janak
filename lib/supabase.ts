import { createClient } from "@supabase/supabase-js";
import { isPortfolioContent, starterContent, type PortfolioContent } from "@/lib/content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// This module is used by server-rendered pages and API routes only.
// Prefer the server-only key for reads so public pages can retrieve the same
// saved content even if the anon role's SELECT permissions are misconfigured.
const readKey = serviceKey || anonKey;

export const hasSupabaseConfig = Boolean(url && readKey);

export const supabase =
  hasSupabaseConfig && url && readKey
    ? createClient(url, readKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export async function getPortfolioContent(): Promise<PortfolioContent> {
  if (!supabase) {
    console.warn("Supabase server/read configuration is missing; using starter content");
    return starterContent;
  }

  try {
    const { data, error } = await supabase
      .from("portfolio_content")
      .select("data")
      .eq("id", "primary")
      .maybeSingle();

    if (error) {
      console.error("Supabase portfolio content read failed:", error.message);
      return starterContent;
    }

    if (data?.data && isPortfolioContent(data.data)) {
      return data.data;
    }

    if (data?.data) {
      console.error("Stored portfolio content has an invalid format; using starter content");
      return starterContent;
    }

    console.warn("No portfolio content row found for id=primary; using starter content");
    return starterContent;
  } catch (err) {
    console.error("Error fetching portfolio content:", err);
    return starterContent;
  }
}
