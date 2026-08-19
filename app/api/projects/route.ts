import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { createProject, listProjects } from "@/lib/services/projectService";
import { createProjectSchema } from "@/lib/validation/projects";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    const areaId = new URL(request.url).searchParams.get("areaId") ?? undefined;
    return NextResponse.json(await listProjects(session.userId, areaId));
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
    const input = createProjectSchema.parse(await request.json());
    return NextResponse.json(await createProject(session.userId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
