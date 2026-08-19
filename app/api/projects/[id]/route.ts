import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { deleteProject, updateProject } from "@/lib/services/projectService";
import { updateProjectSchema } from "@/lib/validation/projects";

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
    const input = updateProjectSchema.parse(await request.json());
    return NextResponse.json(await updateProject(session.userId, id, input));
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
    await deleteProject(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
