-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTarget" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "areaId" TEXT,
    "projectId" TEXT,
    "requiredCount" INTEGER NOT NULL,

    CONSTRAINT "GoalTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalInstance" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "GoalInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "GoalTarget_goalId_idx" ON "GoalTarget"("goalId");

-- CreateIndex
CREATE INDEX "GoalInstance_goalId_windowEnd_idx" ON "GoalInstance"("goalId", "windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "GoalInstance_goalId_windowStart_key" ON "GoalInstance"("goalId", "windowStart");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTarget" ADD CONSTRAINT "GoalTarget_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTarget" ADD CONSTRAINT "GoalTarget_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTarget" ADD CONSTRAINT "GoalTarget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalInstance" ADD CONSTRAINT "GoalInstance_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
