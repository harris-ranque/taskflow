import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BACKEND_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:8000";

function getAuthHeader(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  return authorization && authorization.toLowerCase().startsWith("bearer ")
    ? authorization
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/emails/welcome`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to queue welcome email", details: payload },
        { status: response.status },
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Backend unreachable",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
