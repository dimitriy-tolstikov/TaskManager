import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Task Manager</h1>
      <p className="text-muted-foreground">Вы вошли как {session.email}</p>
      <LogoutButton />
    </main>
  );
}
