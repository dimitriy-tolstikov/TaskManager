import { redirect } from "next/navigation";

import { TasksApp } from "@/components/tasks/TasksApp";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <TasksApp userEmail={session.email} />;
}
