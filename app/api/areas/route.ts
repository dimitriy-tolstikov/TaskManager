import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { createArea, listAreas } from "@/lib/services/areaService";
import { createAreaSchema } from "@/lib/validation/areas";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    return NextResponse.json(await listAreas(session.userId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    const input = createAreaSchema.parse(await request.json());
    return NextResponse.json(await createArea(session.userId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
