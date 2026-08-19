import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { deleteGoal, updateGoal } from "@/lib/services/goalService";
import { updateGoalSchema } from "@/lib/validation/goals";

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
    const input = updateGoalSchema.parse(await request.json());
    return NextResponse.json(await updateGoal(session.userId, id, input));
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
    await deleteGoal(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
