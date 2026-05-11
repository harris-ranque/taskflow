import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BACKEND_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:8000";

function getAuthHeader(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  return authorization && authorization.toLowerCase().startsWith("bearer ")
    ? authorization
    : null;
}

function extractRows(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? data : [];
  }

  return [];
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      cache: "no-store",
      headers: { Authorization: authHeader },
    });
    const payload = await response.json().catch(() => []);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch tasks", details: payload },
        { status: response.status },
      );
    }

    return NextResponse.json(extractRows(payload));
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to create task", details: payload },
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
