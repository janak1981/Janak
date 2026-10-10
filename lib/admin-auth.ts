import { NextRequest, NextResponse } from "next/server";

const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "your-secret-key";

export function verifyAdminToken(token: string): boolean {
  try {
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    // Check if token has expired
    if (payload.exp && payload.exp < Date.now()) {
      return false;
    }

    // Verify signature (simple check for demo)
    const expectedSignature = Buffer.from(
      `${parts[0]}.${parts[1]}.${ADMIN_TOKEN_SECRET}`
    ).toString("base64");

    return parts[2] === expectedSignature;
  } catch {
    return false;
  }
}

export function requireAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }

    return handler(request, ...args);
  };
}
