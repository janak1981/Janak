import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { isPortfolioContent, type PortfolioContent } from "@/lib/content";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

async function handler(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server configuration is missing. Configure the project URL and a server-side Supabase key in Vercel." },
      { status: 500 },
    );
  }

  if (request.method === "GET") {
    try {
      // The admin API must report database failures instead of silently showing
      // starter content, otherwise users can mistake defaults for saved data.
      const { data, error } = await supabase
        .from("portfolio_content")
        .select("data, updated_at")
        .eq("id", "primary")
        .maybeSingle();

      if (error) {
        console.error("Admin content read failed:", error.message);
        return NextResponse.json(
          { error: "Could not read saved content from Supabase." },
          { status: 500 },
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "No saved portfolio content exists in Supabase yet." },
          { status: 404 },
        );
      }

      if (!isPortfolioContent(data.data)) {
        console.error("Saved portfolio content has an invalid structure.");
        return NextResponse.json(
          { error: "Saved content has an invalid format. No data was changed." },
          { status: 500 },
        );
      }

      return NextResponse.json({ content: data.data, updatedAt: data.updated_at });
    } catch (error) {
      console.error("Admin content read exception:", error instanceof Error ? error.message : "Unknown error");
      return NextResponse.json({ error: "Failed to read saved content from Supabase." }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const content = body?.content as PortfolioContent | undefined;

      if (!content || !isPortfolioContent(content)) {
        return NextResponse.json(
          { error: "Invalid content structure. Nothing was saved." },
          { status: 400 },
        );
      }

      const { data, error } = await supabase
        .from("portfolio_content")
        .upsert(
          {
            id: "primary",
            data: content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("data, updated_at")
        .single();

      if (error) {
        console.error("Supabase content upsert failed:", error.message);
        return NextResponse.json(
          { error: "Supabase did not confirm the content save. Check Vercel server-key configuration and Supabase logs." },
          { status: 500 },
        );
      }

      if (!data || !isPortfolioContent(data.data) || JSON.stringify(data.data) !== JSON.stringify(content)) {
        console.error("Supabase upsert returned content that does not match the submitted content.");
        return NextResponse.json(
          { error: "Supabase did not confirm that the submitted content was stored. Please retry; your changes are not confirmed saved." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Content saved and verified in Supabase.",
        updatedAt: data.updated_at,
      });
    } catch (error) {
      console.error("Failed to save portfolio content:", error instanceof Error ? error.message : "Unknown error");
      return NextResponse.json(
        { error: "Failed to save content. Check the Supabase server key and portfolio_content table configuration." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const GET = requireAdminAuth(handler);
export const PUT = requireAdminAuth(handler);
