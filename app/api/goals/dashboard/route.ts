import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { getDashboard } from "@/lib/services/goalDashboardService";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    return NextResponse.json(await getDashboard(session.userId));
  } catch (error) {
    return errorResponse(error);
  }
}
