import { createClient } from "@supabase/supabase-js";
import { isPortfolioContent, starterContent, type PortfolioContent } from "@/lib/content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(url && anonKey);

export const supabase =
  hasSupabaseConfig && url && anonKey
    ? createClient(url, anonKey)
    : null;

export async function getPortfolioContent(): Promise<PortfolioContent> {
  if (!supabase) return starterContent;

  const { data, error } = await supabase
    .from("portfolio_content")
    .select("data")
    .eq("id", "primary")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load portfolio content: ${error.message}`);
  }

  if (data?.data && isPortfolioContent(data.data)) {
    return data.data;
  }
  if (data?.data) {
    throw new Error("Stored portfolio content has an invalid format.");
  }
  return starterContent;
}
