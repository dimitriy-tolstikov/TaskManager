import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { addSubtask } from "@/lib/services/subtaskService";
import { createSubtaskSchema } from "@/lib/validation/subtasks";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    const { id } = await params;
    const input = createSubtaskSchema.parse(await request.json());
    return NextResponse.json(await addSubtask(session.userId, id, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
