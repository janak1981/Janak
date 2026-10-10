import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.PORTFOLIO_ADMIN_PASSWORD || "admin123";
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "your-secret-key";

interface LoginBody {
  password: string;
}

// Simple JWT token generator
function generateToken(password: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(
    JSON.stringify({
      authenticated: true,
      timestamp: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
  ).toString("base64");

  // Simple HMAC-like signature (for production, use proper JWT library)
  const signature = Buffer.from(
    `${header}.${payload}.${ADMIN_TOKEN_SECRET}`
  ).toString("base64");

  return `${header}.${payload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = generateToken(password);

    return NextResponse.json({
      success: true,
      token,
      message: "Login successful",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
