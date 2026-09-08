-- Phase 3: Request Management, Task Decomposition & Workflow
--
-- RequestStatus and TaskStatus are replaced with the spec's workflow enums.
-- Existing rows are remapped (not dropped) via an explicit CASE, since the
-- generic `prisma migrate diff` cast (`status::text::NewEnum`) would fail on
-- any row still holding an old value that no longer exists in the new type.

-- AlterEnum: RequestStatus
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('NEW', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'CHANGES_REQUIRED', 'COMPLETED', 'ARCHIVED');
ALTER TABLE "public"."Request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "RequestStatus_new" USING (
  CASE "status"::text
    WHEN 'REVIEWING' THEN 'UNDER_REVIEW'
    WHEN 'APPROVED' THEN 'ASSIGNED'
    WHEN 'CONVERTED' THEN 'COMPLETED'
    WHEN 'REJECTED' THEN 'CHANGES_REQUIRED'
    ELSE "status"::text
  END
)::"RequestStatus_new";
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterEnum: ScopeItemCategory (additive, no remap needed)
ALTER TYPE "ScopeItemCategory" ADD VALUE 'PRESENTATION';

-- AlterEnum: TaskStatus
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'CHANGES_REQUIRED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING (
  CASE "status"::text
    WHEN 'IN_REVIEW' THEN 'INTERNAL_REVIEW'
    WHEN 'DONE' THEN 'COMPLETED'
    ELSE "status"::text
  END
)::"TaskStatus_new";
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';
COMMIT;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "taskId" TEXT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "requestedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "actualHours" DECIMAL(6,2),
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "estimatedHours" DECIMAL(6,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ScopeItemCategory",
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "defaultPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "defaultEstimatedHours" DECIMAL(6,2),
    "dependsOnOrder" INTEGER,

    CONSTRAINT "RequestTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "TaskDependency_taskId_idx" ON "TaskDependency"("taskId");

-- CreateIndex
CREATE INDEX "TaskDependency_dependsOnTaskId_idx" ON "TaskDependency"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnTaskId_key" ON "TaskDependency"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE INDEX "RequestTemplateItem_templateId_idx" ON "RequestTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "Asset_taskId_idx" ON "Asset"("taskId");

-- CreateIndex
CREATE INDEX "Asset_requestId_idx" ON "Asset"("requestId");

-- CreateIndex
CREATE INDEX "Request_campaignId_idx" ON "Request"("campaignId");

-- CreateIndex
CREATE INDEX "Task_requestId_idx" ON "Task"("requestId");

-- CreateIndex
CREATE INDEX "Task_departmentId_idx" ON "Task"("departmentId");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateItem" ADD CONSTRAINT "RequestTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RequestTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateItem" ADD CONSTRAINT "RequestTemplateItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;
