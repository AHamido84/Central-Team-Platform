-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_clientId_idx" ON "AuditLog"("clientId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
