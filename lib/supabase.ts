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
  // If no Supabase config, return starter content
  if (!supabase) {
    console.log("No Supabase config found, using starter content");
    return starterContent;
  }

  try {
    const { data, error } = await supabase
      .from("portfolio_content")
      .select("data")
      .eq("id", "primary")
      .maybeSingle();

    if (error) {
      console.warn(`Supabase error: ${error.message}, using starter content`);
      return starterContent;
    }

    if (data?.data && isPortfolioContent(data.data)) {
      return data.data;
    }
    
    if (data?.data) {
      console.warn("Stored portfolio content has invalid format, using starter");
      return starterContent;
    }
    
    // No data found, use starter
    return starterContent;
  } catch (err) {
    console.error("Error fetching portfolio content:", err);
    return starterContent;
  }
}
