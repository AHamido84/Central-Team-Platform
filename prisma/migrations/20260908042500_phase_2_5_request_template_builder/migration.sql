-- Phase 2.5: Request Template Builder & Versioned Dynamic Forms
--
-- Replaces the flat Phase 3 RequestTemplate/RequestTemplateItem pair with a
-- versioned Sections -> Fields -> Options + Tasks -> Dependencies
-- structure. There are zero production rows in either old table (verified
-- before writing this migration), so existing rows are cleared rather than
-- migrated field-by-field — the old shape (a bare title list) has no
-- equivalent in the new one anyway.

-- CreateEnum
CREATE TYPE "TemplateFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'DATE', 'DATETIME', 'CHECKBOX', 'RADIO', 'SELECT', 'MULTI_SELECT', 'EMAIL', 'PHONE', 'URL', 'FILE', 'COLOR');

-- Clear any pre-existing (test-only) rows before reshaping the table.
DELETE FROM "RequestTemplateItem";
DELETE FROM "RequestTemplate";

-- DropForeignKey
ALTER TABLE "RequestTemplateItem" DROP CONSTRAINT "RequestTemplateItem_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "RequestTemplateItem" DROP CONSTRAINT "RequestTemplateItem_templateId_fkey";

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "templateVersionId" TEXT;

-- AlterTable
ALTER TABLE "RequestTemplate" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currentVersionId" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestTypeId" TEXT NOT NULL,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "RequestTemplateItem";

-- CreateTable
CREATE TABLE "RequestTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "defaultPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "defaultDurationDays" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTemplateSection" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "RequestTemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTemplateField" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "type" "TemplateFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "defaultValue" TEXT,
    "minValue" DECIMAL(14,2),
    "maxValue" DECIMAL(14,2),
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "visibleIfFieldKey" TEXT,
    "visibleIfValue" TEXT,

    CONSTRAINT "RequestTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTemplateFieldOption" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RequestTemplateFieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTemplateTask" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "defaultPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "defaultEstimatedHours" DECIMAL(6,2),
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "dependsOnOrder" INTEGER,

    CONSTRAINT "RequestTemplateTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestFieldValue" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" JSONB,

    CONSTRAINT "RequestFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestTemplateVersion_templateId_idx" ON "RequestTemplateVersion"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestTemplateVersion_templateId_version_key" ON "RequestTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "RequestTemplateSection_versionId_idx" ON "RequestTemplateSection"("versionId");

-- CreateIndex
CREATE INDEX "RequestTemplateField_sectionId_idx" ON "RequestTemplateField"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestTemplateField_versionId_key_key" ON "RequestTemplateField"("versionId", "key");

-- CreateIndex
CREATE INDEX "RequestTemplateFieldOption_fieldId_idx" ON "RequestTemplateFieldOption"("fieldId");

-- CreateIndex
CREATE INDEX "RequestTemplateTask_versionId_idx" ON "RequestTemplateTask"("versionId");

-- CreateIndex
CREATE INDEX "RequestFieldValue_requestId_idx" ON "RequestFieldValue"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestFieldValue_requestId_fieldId_key" ON "RequestFieldValue"("requestId", "fieldId");

-- CreateIndex
CREATE INDEX "Request_templateVersionId_idx" ON "Request"("templateVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestTemplate_currentVersionId_key" ON "RequestTemplate"("currentVersionId");

-- CreateIndex
CREATE INDEX "RequestTemplate_requestTypeId_idx" ON "RequestTemplate"("requestTypeId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "RequestTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplate" ADD CONSTRAINT "RequestTemplate_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "RequestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplate" ADD CONSTRAINT "RequestTemplate_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "RequestTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplate" ADD CONSTRAINT "RequestTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateVersion" ADD CONSTRAINT "RequestTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RequestTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateSection" ADD CONSTRAINT "RequestTemplateSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RequestTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateField" ADD CONSTRAINT "RequestTemplateField_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RequestTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateField" ADD CONSTRAINT "RequestTemplateField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RequestTemplateSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateFieldOption" ADD CONSTRAINT "RequestTemplateFieldOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "RequestTemplateField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateTask" ADD CONSTRAINT "RequestTemplateTask_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RequestTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTemplateTask" ADD CONSTRAINT "RequestTemplateTask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestFieldValue" ADD CONSTRAINT "RequestFieldValue_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestFieldValue" ADD CONSTRAINT "RequestFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "RequestTemplateField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
