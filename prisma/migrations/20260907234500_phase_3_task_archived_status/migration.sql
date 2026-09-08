-- AlterEnum: add ARCHIVED as a terminal TaskStatus, matching the
-- ARCHIVED-status pattern already used by Client/Contract/Project/Request.
ALTER TYPE "TaskStatus" ADD VALUE 'ARCHIVED';
