import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { createTask, listTasks } from "@/lib/services/taskService";
import { createTaskSchema, taskFiltersSchema } from "@/lib/validation/tasks";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const filters = taskFiltersSchema.parse(query);
    return NextResponse.json(await listTasks(session.userId, filters));
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
    const input = createTaskSchema.parse(await request.json());
    return NextResponse.json(await createTask(session.userId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
