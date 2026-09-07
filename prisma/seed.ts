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
  "requests.create",
  "deliverables.approve",
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
    permissions: ["projects.view", "requests.create", "deliverables.approve"],
  },
  {
    name: "CLIENT_USER",
    description: "Client-side user with read access to their own projects",
    permissions: ["projects.view", "requests.create", "deliverables.approve"],
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

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

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
  const requestTypeIdByName = new Map<string, string>();
  for (const name of REQUEST_TYPES) {
    const rt = await prisma.requestType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    requestTypeIdByName.set(name, rt.id);
  }

  console.log("Seeding demo admin user...");
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const superAdminRoleId = roleIdByName.get("SUPER_ADMIN")!;
  const adminUser = await prisma.user.upsert({
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

  // ---------------------------------------------------------------------
  // Primary demo client — the one the portal walkthrough uses. Rich enough
  // to exercise every Phase 1 portal screen: scope with per-category
  // progress, requests, tasks (some internal-only), deliverables (one
  // pending the client's review), a campaign with metrics, and an activity
  // history.
  // ---------------------------------------------------------------------
  console.log("Seeding primary demo client, project and scope...");
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

  const fullMarketingType = await prisma.projectType.findUniqueOrThrow({
    where: { name: "Full Marketing" },
  });

  const demoProject = await prisma.project.upsert({
    where: { id: "demo-project-brochure" },
    update: {},
    create: {
      id: "demo-project-brochure",
      clientId: demoClient.id,
      projectTypeId: fullMarketingType.id,
      name: "إطلاق البروشور والحملة الرقمية",
      description: "تصميم بروشور تعريفي بالشركة وخدماتها مع حملة إعلانية داعمة",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: daysAgo(21),
      dueDate: daysFromNow(14),
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

  const scopeItems: {
    id: string;
    category: Parameters<typeof prisma.scopeItem.create>[0]["data"]["category"];
    name: string;
    quantity: number;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  }[] = [
    { id: "demo-si-strategy", category: "MARKETING_STRATEGY", name: "الخطة التسويقية", quantity: 1, status: "COMPLETED" },
    { id: "demo-si-design-done", category: "DESIGN", name: "تصميمات السوشيال ميديا", quantity: 15, status: "COMPLETED" },
    { id: "demo-si-design-progress", category: "DESIGN", name: "تصميمات إضافية للحملة", quantity: 5, status: "IN_PROGRESS" },
    { id: "demo-si-video-done", category: "VIDEO", name: "فيديوهات قصيرة", quantity: 3, status: "COMPLETED" },
    { id: "demo-si-video-planned", category: "VIDEO", name: "فيديو تعريفي طويل", quantity: 2, status: "PLANNED" },
    { id: "demo-si-voice-done", category: "VOICE_OVER", name: "تعليق صوتي - الحملة", quantity: 2, status: "COMPLETED" },
    { id: "demo-si-voice-planned", category: "VOICE_OVER", name: "تعليق صوتي إضافي", quantity: 1, status: "PLANNED" },
    { id: "demo-si-landing", category: "LANDING_PAGE", name: "صفحة الهبوط", quantity: 1, status: "COMPLETED" },
    { id: "demo-si-advertising", category: "ADVERTISING", name: "الحملة الإعلانية", quantity: 1, status: "IN_PROGRESS" },
  ];

  for (const item of scopeItems) {
    await prisma.scopeItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        projectScopeId: demoScope.id,
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        status: item.status,
      },
    });
  }

  console.log("Seeding demo tasks...");
  const tasks: {
    id: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    clientVisible: boolean;
    dueDate: Date;
  }[] = [
    { id: "demo-task-copy-review", title: "مراجعة المحتوى النصي للبروشور", status: "DONE", clientVisible: true, dueDate: daysAgo(14) },
    { id: "demo-task-design", title: "تصميم الهوية البصرية للبروشور", status: "IN_PROGRESS", clientVisible: true, dueDate: daysFromNow(3) },
    { id: "demo-task-print", title: "تجهيز ملف الطباعة النهائي", status: "TODO", clientVisible: true, dueDate: daysFromNow(10) },
    { id: "demo-task-qa", title: "مراجعة جودة داخلية", status: "IN_REVIEW", clientVisible: false, dueDate: daysFromNow(1) },
    { id: "demo-task-report", title: "إعداد تقرير الأداء الشهري", status: "TODO", clientVisible: false, dueDate: daysFromNow(20) },
  ];
  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        projectId: demoProject.id,
        title: task.title,
        status: task.status,
        clientVisible: task.clientVisible,
        dueDate: task.dueDate,
      },
    });
  }

  console.log("Seeding demo deliverables and assets...");
  const deliverableV1 = await prisma.deliverable.upsert({
    where: { id: "demo-deliverable-design-v1" },
    update: {},
    create: {
      id: "demo-deliverable-design-v1",
      projectId: demoProject.id,
      title: "تصميم البروشور - النسخة الأولى",
      category: "DESIGN",
      type: "PDF",
      status: "APPROVED",
      version: 1,
      deliveredAt: daysAgo(10),
    },
  });
  await prisma.asset.upsert({
    where: { id: "demo-asset-design-v1" },
    update: {},
    create: {
      id: "demo-asset-design-v1",
      deliverableId: deliverableV1.id,
      projectId: demoProject.id,
      clientId: demoClient.id,
      fileName: "brochure-design-v1.pdf",
      fileUrl: "/file.svg",
      fileType: "application/pdf",
    },
  });

  const deliverableV2 = await prisma.deliverable.upsert({
    where: { id: "demo-deliverable-design-v2" },
    update: {},
    create: {
      id: "demo-deliverable-design-v2",
      projectId: demoProject.id,
      title: "تصميم البروشور - نسخة معدّلة",
      category: "DESIGN",
      type: "PDF",
      status: "IN_REVIEW",
      version: 2,
    },
  });
  await prisma.asset.upsert({
    where: { id: "demo-asset-design-v2" },
    update: {},
    create: {
      id: "demo-asset-design-v2",
      deliverableId: deliverableV2.id,
      projectId: demoProject.id,
      clientId: demoClient.id,
      fileName: "brochure-design-v2.pdf",
      fileUrl: "/file.svg",
      fileType: "application/pdf",
    },
  });

  const deliverableVideo = await prisma.deliverable.upsert({
    where: { id: "demo-deliverable-video-draft" },
    update: {},
    create: {
      id: "demo-deliverable-video-draft",
      projectId: demoProject.id,
      title: "فيديو تعريفي قصير",
      category: "VIDEO",
      type: "MP4",
      status: "DRAFT",
      version: 1,
    },
  });
  await prisma.asset.upsert({
    where: { id: "demo-asset-video-draft" },
    update: {},
    create: {
      id: "demo-asset-video-draft",
      deliverableId: deliverableVideo.id,
      projectId: demoProject.id,
      clientId: demoClient.id,
      fileName: "intro-video-draft.mp4",
      fileUrl: "/window.svg",
      fileType: "video/mp4",
    },
  });

  console.log("Seeding demo requests...");
  await prisma.request.upsert({
    where: { id: "demo-request-banner" },
    update: {},
    create: {
      id: "demo-request-banner",
      clientId: demoClient.id,
      projectId: demoProject.id,
      requestTypeId: requestTypeIdByName.get("Change request")!,
      title: "طلب إضافة بانر إعلاني إضافي",
      description: "نحتاج بانر بمقاس مربع لمنصات التواصل الاجتماعي",
      status: "REVIEWING",
      dueDate: daysFromNow(5),
    },
  });
  await prisma.request.upsert({
    where: { id: "demo-request-timeline" },
    update: {},
    create: {
      id: "demo-request-timeline",
      clientId: demoClient.id,
      projectId: demoProject.id,
      requestTypeId: requestTypeIdByName.get("General inquiry")!,
      title: "استفسار عن الجدول الزمني للتسليم",
      status: "NEW",
    },
  });

  console.log("Seeding demo campaign and metrics...");
  const demoCampaign = await prisma.campaign.upsert({
    where: { id: "demo-campaign-launch" },
    update: {},
    create: {
      id: "demo-campaign-launch",
      projectId: demoProject.id,
      name: "حملة إطلاق البروشور الرقمي",
      platform: "META",
      status: "ACTIVE",
      objective: "زيادة الوعي بالعلامة التجارية وتوليد عملاء محتملين",
      budget: 5000,
      currency: "SAR",
      startDate: daysAgo(14),
      endDate: daysFromNow(16),
    },
  });
  await prisma.campaignMetric.upsert({
    where: { campaignId: demoCampaign.id },
    update: {},
    create: {
      campaignId: demoCampaign.id,
      spend: 1250.5,
      impressions: 85000,
      reach: 62000,
      clicks: 1800,
      leads: 45,
      conversions: 12,
      revenue: 9600,
      currency: "SAR",
    },
  });

  console.log("Seeding demo activity log...");
  const activityEntries: { id: string; action: string; entityType: string; entityId: string; createdAt: Date }[] = [
    { id: "demo-activity-1", action: "PROJECT_CREATED", entityType: "Project", entityId: demoProject.id, createdAt: daysAgo(21) },
    { id: "demo-activity-2", action: "SCOPE_ITEM_CREATED", entityType: "ScopeItem", entityId: "demo-si-design-done", createdAt: daysAgo(20) },
    { id: "demo-activity-3", action: "TASK_STARTED", entityType: "Task", entityId: "demo-task-design", createdAt: daysAgo(12) },
    { id: "demo-activity-4", action: "DELIVERABLE_UPLOADED", entityType: "Deliverable", entityId: deliverableV1.id, createdAt: daysAgo(11) },
    { id: "demo-activity-5", action: "DELIVERABLE_SENT_FOR_REVIEW", entityType: "Deliverable", entityId: deliverableV1.id, createdAt: daysAgo(10) },
    { id: "demo-activity-6", action: "DELIVERABLE_APPROVED", entityType: "Deliverable", entityId: deliverableV1.id, createdAt: daysAgo(9) },
    { id: "demo-activity-7", action: "DELIVERABLE_UPLOADED", entityType: "Deliverable", entityId: deliverableV2.id, createdAt: daysAgo(2) },
    { id: "demo-activity-8", action: "DELIVERABLE_SENT_FOR_REVIEW", entityType: "Deliverable", entityId: deliverableV2.id, createdAt: daysAgo(1) },
  ];
  for (const entry of activityEntries) {
    await prisma.auditLog.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        actorId: adminUser.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        projectId: demoProject.id,
        createdAt: entry.createdAt,
      },
    });
  }

  console.log("Seeding demo client-portal user...");
  const clientUserPasswordHash = await bcrypt.hash("Client123!", 10);
  const clientAdminRoleId = roleIdByName.get("CLIENT_ADMIN")!;
  const clientUser = await prisma.user.upsert({
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

  console.log("Seeding demo notifications...");
  await prisma.notification.upsert({
    where: { id: "demo-notification-approved" },
    update: {},
    create: {
      id: "demo-notification-approved",
      userId: clientUser.id,
      type: "DELIVERABLE_APPROVED",
      title: "تم اعتماد تصميم البروشور",
      message: "تم اعتماد النسخة الأولى من تصميم البروشور بنجاح",
      link: `/portal/deliverables/${deliverableV1.id}`,
      isRead: true,
    },
  });
  await prisma.notification.upsert({
    where: { id: "demo-notification-review" },
    update: {},
    create: {
      id: "demo-notification-review",
      userId: clientUser.id,
      type: "DELIVERABLE_SENT_FOR_REVIEW",
      title: "تصميم جديد بانتظار مراجعتك",
      message: "تم رفع النسخة المعدّلة من تصميم البروشور وهي بانتظار موافقتك",
      link: `/portal/deliverables/${deliverableV2.id}`,
      isRead: false,
    },
  });

  // ---------------------------------------------------------------------
  // Second client — exists purely so the client-isolation check has
  // something real to fail against: this user must never see anything
  // belonging to demo-client-abc.
  // ---------------------------------------------------------------------
  console.log("Seeding second demo client for isolation testing...");
  const secondClient = await prisma.client.upsert({
    where: { id: "demo-client-xyz" },
    update: {},
    create: {
      id: "demo-client-xyz",
      companyName: "شركة الأفق للتقنية",
      industry: "التقنية",
      email: "contact@ufuq-tech.example",
      status: "ACTIVE",
    },
  });

  const brandingType = await prisma.projectType.findUniqueOrThrow({
    where: { name: "Branding" },
  });

  const secondProject = await prisma.project.upsert({
    where: { id: "demo-project-branding" },
    update: {},
    create: {
      id: "demo-project-branding",
      clientId: secondClient.id,
      projectTypeId: brandingType.id,
      name: "تصميم الهوية البصرية",
      status: "PLANNED",
      priority: "MEDIUM",
    },
  });

  const secondScope = await prisma.projectScope.upsert({
    where: { id: "demo-scope-2" },
    update: {},
    create: { id: "demo-scope-2", projectId: secondProject.id, version: 1, status: "DRAFT" },
  });
  await prisma.scopeItem.upsert({
    where: { id: "demo-si-branding-logo" },
    update: {},
    create: {
      id: "demo-si-branding-logo",
      projectScopeId: secondScope.id,
      category: "DESIGN",
      name: "تصميم الشعار",
      quantity: 3,
      status: "PLANNED",
    },
  });

  await prisma.user.upsert({
    where: { email: "client2@example.com" },
    update: {},
    create: {
      name: "عميل تجريبي 2",
      email: "client2@example.com",
      passwordHash: clientUserPasswordHash,
      roleId: clientAdminRoleId,
      clientId: secondClient.id,
      status: "ACTIVE",
      locale: "ar",
    },
  });

  console.log("Done.");
  console.log("  Internal admin login: admin@centralteam.local / Admin123!");
  console.log("  Client portal login:  client@example.com / Client123! (شركة النجاح للتسويق)");
  console.log("  Client portal login:  client2@example.com / Client123! (شركة الأفق للتقنية — isolation check)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
