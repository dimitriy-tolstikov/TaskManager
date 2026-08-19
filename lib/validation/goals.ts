import { z } from "zod";

// Times are minutes from midnight (0..1439); daysOfWeek uses JS getDay (0 = Sunday), empty = daily.
const timeSchema = z.number().int().min(0).max(1439);
const daysOfWeekSchema = z.array(z.number().int().min(0).max(6)).max(7);

const targetSchema = z
  .object({
    areaId: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    requiredCount: z.number().int().min(1, "Количество должно быть не меньше 1").max(100),
  })
  .refine((target) => Number(Boolean(target.areaId)) + Number(Boolean(target.projectId)) === 1, {
    message: "Укажите направление или проект (ровно одно)",
  });

const goalFieldsSchema = z.object({
  name: z.string().min(1, "Введите название цели").max(200),
  startTime: timeSchema,
  endTime: timeSchema,
  daysOfWeek: daysOfWeekSchema.default([]),
  targets: z.array(targetSchema).min(1, "Добавьте хотя бы один таргет").max(10),
});

export const createGoalSchema = goalFieldsSchema.refine((goal) => goal.startTime !== goal.endTime, {
  message: "Начало и конец окна не должны совпадать",
});

export const updateGoalSchema = z
  .object({
    name: z.string().min(1, "Введите название цели").max(200).optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    daysOfWeek: daysOfWeekSchema.optional(),
    active: z.boolean().optional(),
    targets: z.array(targetSchema).min(1).max(10).optional(),
  })
  .refine(
    (goal) =>
      goal.startTime === undefined || goal.endTime === undefined || goal.startTime !== goal.endTime,
    { message: "Начало и конец окна не должны совпадать" },
  );

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalTargetInput = z.infer<typeof targetSchema>;
