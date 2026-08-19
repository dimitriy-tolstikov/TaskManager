import { db } from "@/lib/db";
import { hashPassword } from "@/lib/services/authService";
import { ensureInboxProject } from "@/lib/services/projectService";

async function main(): Promise<void> {
  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Демо",
      passwordHash: await hashPassword("demo12345"),
    },
  });

  await ensureInboxProject(user.id);

  // Reset demo content on reseed: non-inbox areas cascade-delete projects and tasks.
  await db.area.deleteMany({ where: { userId: user.id, position: { gte: 0 } } });

  const work = await db.area.create({
    data: { userId: user.id, name: "Работа", color: "#3b82f6", position: 0 },
  });
  const study = await db.area.create({
    data: { userId: user.id, name: "Учёба", color: "#22c55e", position: 1 },
  });

  const website = await db.project.create({
    data: { areaId: work.id, name: "Сайт компании" },
  });
  const diploma = await db.project.create({
    data: { areaId: study.id, name: "Диплом" },
  });

  await db.task.create({
    data: {
      projectId: website.id,
      title: "Сверстать лендинг",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimateMin: 240,
      subtasks: {
        create: [
          { title: "Шапка и hero-блок", done: true, position: 0 },
          { title: "Форма обратной связи", done: false, position: 1 },
        ],
      },
    },
  });

  await db.task.create({
    data: {
      projectId: website.id,
      title: "Настроить аналитику",
      status: "TODO",
      priority: "MED",
    },
  });

  await db.task.create({
    data: {
      projectId: diploma.id,
      title: "Написать введение",
      status: "BACKLOG",
      priority: "MED",
      estimateMin: 120,
      subtasks: {
        create: [{ title: "Собрать источники", done: false, position: 0 }],
      },
    },
  });

  console.log(`Seed done: user ${user.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
