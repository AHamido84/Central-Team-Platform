import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  "clients.view",
  "clients.create",
  "clients.update",
  "clients.delete",
  "projects.view",
  "projects.create",
  "projects.update",
  "projects.delete",
] as const;

const ROLES: {
  name: string;
  description: string;
  permissions: readonly string[];
}[] = [
  {
    name: "SUPER_ADMIN",
    description: "Full access to every internal area of the platform",
    permissions: PERMISSIONS,
  },
  {
    name: "ACCOUNT_MANAGER",
    description: "Manages client relationships, contracts and projects",
    permissions: PERMISSIONS,
  },
  {
    name: "PROJECT_MANAGER",
    description: "Runs project delivery day to day",
    permissions: [
      "clients.view",
      "projects.view",
      "projects.create",
      "projects.update",
    ],
  },
  {
    name: "STAFF",
    description: "General internal staff, read access",
    permissions: ["clients.view", "projects.view"],
  },
  {
    name: "CLIENT_ADMIN",
    description: "Client-side administrator for their own company's portal",
    permissions: ["projects.view"],
  },
  {
    name: "CLIENT_USER",
    description: "Client-side user with read access to their own projects",
    permissions: ["projects.view"],
  },
];

const PROJECT_TYPES = [
  "Creative",
  "Marketing Strategy",
  "Advertising",
  "Social Media",
  "Video Production",
  "Branding",
  "Website",
  "SEO",
  "Lead Generation",
  "Sales Support",
  "Full Marketing",
];

const REQUEST_TYPES = ["New project request", "Change request", "Support request", "General inquiry"];

async function main() {
  console.log("Seeding permissions...");
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );
  const permissionIdByKey = new Map(permissionRecords.map((p) => [p.key, p.id]));

  console.log("Seeding roles...");
  const roleIdByName = new Map<string, string>();
  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
    });
    roleIdByName.set(role.name, role.id);

    for (const permKey of roleDef.permissions) {
      const permissionId = permissionIdByKey.get(permKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  console.log("Seeding project types...");
  for (const name of PROJECT_TYPES) {
    await prisma.projectType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding request types...");
  for (const name of REQUEST_TYPES) {
    await prisma.requestType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding demo admin user...");
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const superAdminRoleId = roleIdByName.get("SUPER_ADMIN")!;
  await prisma.user.upsert({
    where: { email: "admin@centralteam.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@centralteam.local",
      passwordHash: adminPasswordHash,
      roleId: superAdminRoleId,
      status: "ACTIVE",
      locale: "ar",
    },
  });

  console.log("Seeding demo client, project and scope...");
  const demoClient = await prisma.client.upsert({
    where: { id: "demo-client-abc" },
    update: {},
    create: {
      id: "demo-client-abc",
      companyName: "شركة النجاح للتسويق",
      legalName: "شركة النجاح للتسويق ذ.م.م",
      industry: "التجزئة",
      website: "https://example.com",
      email: "contact@example.com",
      phone: "+966500000000",
      status: "ACTIVE",
    },
  });

  const websiteType = await prisma.projectType.findUniqueOrThrow({
    where: { name: "Website" },
  });

  const demoProject = await prisma.project.upsert({
    where: { id: "demo-project-brochure" },
    update: {},
    create: {
      id: "demo-project-brochure",
      clientId: demoClient.id,
      projectTypeId: websiteType.id,
      name: "تصميم بروشور تعريفي",
      description: "تصميم بروشور تعريفي بالشركة وخدماتها",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
    },
  });

  const demoScope = await prisma.projectScope.upsert({
    where: { id: "demo-scope-1" },
    update: {},
    create: {
      id: "demo-scope-1",
      projectId: demoProject.id,
      version: 1,
      status: "APPROVED",
    },
  });

  await prisma.scopeItem.upsert({
    where: { id: "demo-scope-item-1" },
    update: {},
    create: {
      id: "demo-scope-item-1",
      projectScopeId: demoScope.id,
      category: "COPYWRITING",
      name: "كتابة محتوى البروشور",
      quantity: 1,
      status: "COMPLETED",
    },
  });
  await prisma.scopeItem.upsert({
    where: { id: "demo-scope-item-2" },
    update: {},
    create: {
      id: "demo-scope-item-2",
      projectScopeId: demoScope.id,
      category: "DESIGN",
      name: "تصميم البروشور",
      quantity: 1,
      status: "IN_PROGRESS",
    },
  });

  console.log("Seeding demo client-portal user...");
  const clientUserPasswordHash = await bcrypt.hash("Client123!", 10);
  const clientAdminRoleId = roleIdByName.get("CLIENT_ADMIN")!;
  await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      name: "عميل تجريبي",
      email: "client@example.com",
      passwordHash: clientUserPasswordHash,
      roleId: clientAdminRoleId,
      clientId: demoClient.id,
      status: "ACTIVE",
      locale: "ar",
    },
  });

  console.log("Done.");
  console.log("  Internal admin login: admin@centralteam.local / Admin123!");
  console.log("  Client portal login:  client@example.com / Client123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
