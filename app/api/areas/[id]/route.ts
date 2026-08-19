import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { deleteArea, updateArea } from "@/lib/services/areaService";
import { updateAreaSchema } from "@/lib/validation/areas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    const { id } = await params;
    const input = updateAreaSchema.parse(await request.json());
    return NextResponse.json(await updateArea(session.userId, id, input));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    const { id } = await params;
    await deleteArea(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
