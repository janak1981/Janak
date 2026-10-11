import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getPortfolioContent } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

async function handler(request: NextRequest) {
  if (request.method === "GET") {
    // Fetch current content
    try {
      const content = await getPortfolioContent();
      return NextResponse.json({ content });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      );
    }
  }

  if (request.method === "PUT") {
    // Update content
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    try {
      const body = await request.json();
      const { content } = body;

      // Validate content structure
      if (!content.settings || !Array.isArray(content.pages)) {
        return NextResponse.json(
          { error: "Invalid content structure" },
          { status: 400 }
        );
      }

      // Update in Supabase
      const { error } = await supabase
        .from("portfolio_content")
        .upsert(
          {
            id: "primary",
            data: content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Supabase content update failed:", error.message);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: "Content updated successfully",
      });
    } catch (error) {
      console.error(
        "Failed to update portfolio content:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return NextResponse.json(
        { error: "Failed to update content. Check the Supabase server key and portfolio_content table configuration." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

// Wrap with admin auth
export const GET = requireAdminAuth(handler);
export const PUT = requireAdminAuth(handler);
