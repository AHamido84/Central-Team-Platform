-- Data-only migration: earlier deploys of the Phase 2.5 schema migration
-- did not backfill the `settings.templates.manage` Permission row or grant
-- it to SUPER_ADMIN/ACCOUNT_MANAGER, because prisma migrate deploy only
-- applies schema changes -- role/permission rows are seed data, not schema.
-- Without this, every template builder action correctly (but unintentionally)
-- rejects everyone with "forbidden".

INSERT INTO "Permission" ("id", "key")
SELECT gen_random_uuid()::text, 'settings.templates.manage'
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "key" = 'settings.templates.manage');

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r, "Permission" p
WHERE r."name" IN ('SUPER_ADMIN', 'ACCOUNT_MANAGER')
  AND p."key" = 'settings.templates.manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
