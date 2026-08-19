import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TICK_INTERVAL_MS = 60_000;

async function tick(): Promise<void> {
  // Real push delivery lands in M4; for now we only verify DB connectivity.
  const pendingReminders = await prisma.reminder.count({ where: { sentAt: null } });
  console.log(`[worker] tick ${new Date().toISOString()} pendingReminders=${pendingReminders}`);
}

async function main(): Promise<void> {
  await prisma.$connect();
  console.log("[worker] connected to database, scheduler started");
  await tick();
  setInterval(() => {
    tick().catch((error: unknown) => {
      console.error("[worker] tick failed", error);
    });
  }, TICK_INTERVAL_MS);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

async function shutdown(): Promise<void> {
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
