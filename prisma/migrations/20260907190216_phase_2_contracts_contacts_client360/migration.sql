-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScopeProgressMode" AS ENUM ('QUANTITY', 'TASK_BASED', 'MANUAL', 'WEIGHTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClientStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "ClientStatus" ADD VALUE 'PROSPECT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "ContractStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ContractStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "city" TEXT,
ADD COLUMN     "commercialRegistration" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "ClientContact" ADD COLUMN     "department" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preferredContactMethod" "ContactMethod",
ADD COLUMN     "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "contractNumber" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budget" DECIMAL(14,2),
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'SAR',
ADD COLUMN     "projectCode" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "ScopeItem" ADD COLUMN     "manualProgressPercent" INTEGER,
ADD COLUMN     "progressMode" "ScopeProgressMode" NOT NULL DEFAULT 'QUANTITY',
ADD COLUMN     "weight" DECIMAL(6,2);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
