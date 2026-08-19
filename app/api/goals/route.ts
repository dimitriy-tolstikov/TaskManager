import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { createGoal, listGoals } from "@/lib/services/goalService";
import { createGoalSchema } from "@/lib/validation/goals";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  try {
    return NextResponse.json(await listGoals(session.userId));
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
    const input = createGoalSchema.parse(await request.json());
    return NextResponse.json(await createGoal(session.userId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
