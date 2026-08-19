import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { deleteSubtask, updateSubtask } from "@/lib/services/subtaskService";
import { updateSubtaskSchema } from "@/lib/validation/subtasks";

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
    const input = updateSubtaskSchema.parse(await request.json());
    return NextResponse.json(await updateSubtask(session.userId, id, input));
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
    await deleteSubtask(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
