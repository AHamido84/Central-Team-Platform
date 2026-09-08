import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import type { ScopeItemCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
  "requests.update",
  "requests.delete",
  "deliverables.approve",
  "tasks.create",
  "tasks.update",
  "tasks.delete",
  "deliverables.create",
  "campaigns.create",
  "campaigns.update",
  "leads.manage",
  "opportunities.manage",
  "team.invite",
  "integrations.manage",
  "settings.manage",
  "comments.create",
  "contacts.create",
  "contacts.update",
  "contacts.delete",
  "contracts.view",
  "contracts.create",
  "contracts.update",
  "contracts.delete",
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
      "contacts.create",
      "contacts.update",
      "contracts.view",
      // Phase 3: PMs own request triage and task decomposition.
      "requests.create",
      "requests.update",
      "requests.delete",
      "tasks.create",
      "tasks.update",
      "tasks.delete",
    ],
  },
  {
    name: "STAFF",
    description: "General internal staff, read access",
    // Phase 3: staff execute tasks day to day, so they need to move their
    // own kanban cards even though they can't create/delete/decompose.
    permissions: ["clients.view", "projects.view", "tasks.update"],
  },
  {
    name: "CLIENT_ADMIN",
    description: "Client-side administrator for their own company's portal",
    permissions: ["projects.view", "requests.create", "deliverables.approve", "comments.create"],
  },
  {
    name: "CLIENT_USER",
    description: "Client-side user with read access to their own projects",
    permissions: ["projects.view", "requests.create", "deliverables.approve", "comments.create"],
  },
];

// Phase 3: default departments tasks/staff can be grouped into.
const DEPARTMENTS = [
  "التصميم",
  "الفيديو",
  "المحتوى",
  "المواقع الإلكترونية",
  "الإعلانات",
  "إدارة الحسابات",
];

// Arabic-first: ProjectType/RequestType names are free-text DB content (not
// translation keys), so the seed data itself must be Arabic.
const PROJECT_TYPES = [
  "إبداعي",
  "استراتيجية تسويقية",
  "إعلانات",
  "التواصل الاجتماعي",
  "إنتاج فيديو",
  "هوية بصرية",
  "موقع إلكتروني",
  "تحسين محركات البحث",
  "توليد العملاء المحتملين",
  "دعم المبيعات",
  "تسويق متكامل",
];

// Category drives which dynamic fields the "new request" form shows (see
// src/lib/request-type-fields.ts) — null means a generic request with no
// extra fields beyond title/description.
const REQUEST_TYPES: { name: string; category: ScopeItemCategory | null }[] = [
  { name: "طلب مشروع جديد", category: null },
  { name: "طلب تعديل", category: null },
  { name: "طلب دعم", category: null },
  { name: "استفسار عام", category: null },
  { name: "طلب تصميم", category: "DESIGN" },
  { name: "طلب فيديو", category: "VIDEO" },
  { name: "طلب بروشور", category: "BROCHURE" },
  { name: "طلب حملة إعلانية", category: "ADVERTISING" },
  // Phase 3: the spec's full request-type list (§3).
  { name: "طلب تعليق صوتي", category: "VOICE_OVER" },
  { name: "طلب محتوى", category: "COPYWRITING" },
  { name: "طلب موقع إلكتروني", category: "WEBSITE" },
  { name: "طلب صفحة هبوط", category: "LANDING_PAGE" },
  { name: "طلب تحسين محركات البحث", category: "SEO" },
  { name: "طلب استراتيجية تسويقية", category: "MARKETING_STRATEGY" },
  { name: "طلب دعم مبيعات", category: "SALES_SUPPORT" },
  { name: "طلب تصوير فوتوغرافي", category: "PHOTOGRAPHY" },
  { name: "طلب عرض تقديمي", category: "PRESENTATION" },
  { name: "طلب آخر", category: "OTHER" },
];

// One-time rename of the English names Phase 0/1 originally seeded — a
// plain upsert can't do this (it only matches on the *current* `name`), and
// renaming in place (rather than deleting + recreating) preserves every
// existing Project/Request's foreign key. Safe to leave running forever:
// once a row has been renamed, these updates match zero rows and no-op.
const LEGACY_PROJECT_TYPE_RENAMES: Record<string, string> = {
  Creative: "إبداعي",
  "Marketing Strategy": "استراتيجية تسويقية",
  Advertising: "إعلانات",
  "Social Media": "التواصل الاجتماعي",
  "Video Production": "إنتاج فيديو",
  Branding: "هوية بصرية",
  Website: "موقع إلكتروني",
  SEO: "تحسين محركات البحث",
  "Lead Generation": "توليد العملاء المحتملين",
  "Sales Support": "دعم المبيعات",
  "Full Marketing": "تسويق متكامل",
};
const LEGACY_REQUEST_TYPE_RENAMES: Record<string, string> = {
  "New project request": "طلب مشروع جديد",
  "Change request": "طلب تعديل",
  "Support request": "طلب دعم",
  "General inquiry": "استفسار عام",
};
// These four were briefly (re-)seeded in English before this file settled on
// Arabic names — their Arabic counterparts already exist, so (unlike the
// rename map above) the fix is to delete the English duplicate, and only
// when nothing references it.
const STALE_ENGLISH_REQUEST_TYPE_NAMES = [
  "Design request",
  "Video request",
  "Brochure request",
  "Campaign request",
];

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

  console.log("Seeding departments...");
  const departmentIdByName = new Map<string, string>();
  for (const name of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    departmentIdByName.set(name, department.id);
  }

  console.log("Renaming legacy English project/request types to Arabic...");
  for (const [oldName, newName] of Object.entries(LEGACY_PROJECT_TYPE_RENAMES)) {
    await prisma.projectType.updateMany({ where: { name: oldName }, data: { name: newName } });
  }
  for (const [oldName, newName] of Object.entries(LEGACY_REQUEST_TYPE_RENAMES)) {
    await prisma.requestType.updateMany({ where: { name: oldName }, data: { name: newName } });
  }
  await prisma.requestType.deleteMany({
    where: { name: { in: STALE_ENGLISH_REQUEST_TYPE_NAMES }, requests: { none: {} } },
  });

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
  for (const { name, category } of REQUEST_TYPES) {
    const rt = await prisma.requestType.upsert({
      where: { name },
      update: { category },
      create: { name, category },
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

  await prisma.clientContact.upsert({
    where: { id: "demo-contact-1" },
    update: {},
    create: {
      id: "demo-contact-1",
      clientId: demoClient.id,
      name: "سارة العتيبي",
      position: "مديرة التسويق",
      department: "التسويق",
      email: "sara@example.com",
      phone: "+966501111111",
      whatsapp: "+966501111111",
      preferredContactMethod: "EMAIL",
      isPrimary: true,
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "demo-contact-2" },
    update: {},
    create: {
      id: "demo-contact-2",
      clientId: demoClient.id,
      name: "خالد المطيري",
      position: "الرئيس التنفيذي",
      email: "khaled@example.com",
      phone: "+966502222222",
      preferredContactMethod: "PHONE",
      isPrimary: false,
    },
  });

  const demoContract = await prisma.contract.upsert({
    where: { id: "demo-contract-1" },
    update: {},
    create: {
      id: "demo-contract-1",
      clientId: demoClient.id,
      title: "اتفاقية التسويق المتكامل 2026",
      contractNumber: "CTP-2026-001",
      type: "سنوي",
      startDate: daysAgo(30),
      endDate: daysFromNow(335),
      value: 250000,
      currency: "SAR",
      paymentTerms: "دفعة مقدمة 30% والباقي على 3 دفعات ربع سنوية",
      status: "ACTIVE",
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
  });

  const fullMarketingType = await prisma.projectType.findUniqueOrThrow({
    where: { name: "تسويق متكامل" },
  });

  const demoProject = await prisma.project.upsert({
    where: { id: "demo-project-brochure" },
    update: {},
    create: {
      id: "demo-project-brochure",
      clientId: demoClient.id,
      contractId: demoContract.id,
      projectTypeId: fullMarketingType.id,
      name: "إطلاق البروشور والحملة الرقمية",
      projectCode: "PRJ-0001",
      description: "تصميم بروشور تعريفي بالشركة وخدماتها مع حملة إعلانية داعمة",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: daysAgo(21),
      dueDate: daysFromNow(14),
      budget: 90000,
      currency: "SAR",
      createdById: adminUser.id,
      updatedById: adminUser.id,
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
    unit: string;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  }[] = [
    { id: "demo-si-strategy", category: "MARKETING_STRATEGY", name: "الخطة التسويقية", quantity: 1, unit: "مستند", status: "COMPLETED" },
    { id: "demo-si-design-done", category: "DESIGN", name: "تصميمات السوشيال ميديا", quantity: 15, unit: "تصميم", status: "COMPLETED" },
    { id: "demo-si-design-progress", category: "DESIGN", name: "تصميمات إضافية للحملة", quantity: 5, unit: "تصميم", status: "IN_PROGRESS" },
    { id: "demo-si-video-done", category: "VIDEO", name: "فيديوهات قصيرة", quantity: 3, unit: "فيديو", status: "COMPLETED" },
    { id: "demo-si-video-planned", category: "VIDEO", name: "فيديو تعريفي طويل", quantity: 2, unit: "فيديو", status: "PLANNED" },
    { id: "demo-si-voice-done", category: "VOICE_OVER", name: "تعليق صوتي - الحملة", quantity: 2, unit: "مقطع", status: "COMPLETED" },
    { id: "demo-si-voice-planned", category: "VOICE_OVER", name: "تعليق صوتي إضافي", quantity: 1, unit: "مقطع", status: "PLANNED" },
    { id: "demo-si-landing", category: "LANDING_PAGE", name: "صفحة الهبوط", quantity: 1, unit: "صفحة", status: "COMPLETED" },
    { id: "demo-si-advertising", category: "ADVERTISING", name: "الحملة الإعلانية", quantity: 1, unit: "حملة", status: "IN_PROGRESS" },
  ];

  for (const item of scopeItems) {
    await prisma.scopeItem.upsert({
      where: { id: item.id },
      update: { unit: item.unit },
      create: {
        id: item.id,
        projectScopeId: demoScope.id,
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
      },
    });
  }

  console.log("Seeding demo tasks...");
  const tasks: {
    id: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "INTERNAL_REVIEW" | "COMPLETED";
    clientVisible: boolean;
    dueDate: Date;
  }[] = [
    { id: "demo-task-copy-review", title: "مراجعة المحتوى النصي للبروشور", status: "COMPLETED", clientVisible: true, dueDate: daysAgo(14) },
    { id: "demo-task-design", title: "تصميم الهوية البصرية للبروشور", status: "IN_PROGRESS", clientVisible: true, dueDate: daysFromNow(3) },
    { id: "demo-task-print", title: "تجهيز ملف الطباعة النهائي", status: "TODO", clientVisible: true, dueDate: daysFromNow(10) },
    { id: "demo-task-qa", title: "مراجعة جودة داخلية", status: "INTERNAL_REVIEW", clientVisible: false, dueDate: daysFromNow(1) },
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
      requestTypeId: requestTypeIdByName.get("طلب تعديل")!,
      title: "طلب إضافة بانر إعلاني إضافي",
      description: "نحتاج بانر بمقاس مربع لمنصات التواصل الاجتماعي",
      status: "UNDER_REVIEW",
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
      requestTypeId: requestTypeIdByName.get("استفسار عام")!,
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
    where: { name: "هوية بصرية" },
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
    update: { unit: "تصميم" },
    create: {
      id: "demo-si-branding-logo",
      projectScopeId: secondScope.id,
      category: "DESIGN",
      name: "تصميم الشعار",
      quantity: 3,
      unit: "تصميم",
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

  // ---------------------------------------------------------------------
  // Phase 1.5: more internal staff (Team page + assignee pickers + the
  // dashboard's team-workload chart need real variety across roles).
  // ---------------------------------------------------------------------
  console.log("Seeding additional internal staff...");
  const staffPasswordHash = await bcrypt.hash("Staff123!", 10);
  const accountManagerRoleId = roleIdByName.get("ACCOUNT_MANAGER")!;
  const projectManagerRoleId = roleIdByName.get("PROJECT_MANAGER")!;
  const staffRoleId = roleIdByName.get("STAFF")!;

  const accountManagerUser = await prisma.user.upsert({
    where: { email: "am@centralteam.local" },
    update: {},
    create: {
      name: "منى الحربي",
      email: "am@centralteam.local",
      passwordHash: staffPasswordHash,
      roleId: accountManagerRoleId,
      status: "ACTIVE",
      locale: "ar",
    },
  });
  const projectManagerUser = await prisma.user.upsert({
    where: { email: "pm@centralteam.local" },
    update: {},
    create: {
      name: "سارة العتيبي",
      email: "pm@centralteam.local",
      passwordHash: staffPasswordHash,
      roleId: projectManagerRoleId,
      status: "ACTIVE",
      locale: "ar",
      departmentId: departmentIdByName.get("إدارة الحسابات"),
    },
  });
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@centralteam.local" },
    update: {},
    create: {
      name: "فهد القحطاني",
      email: "staff@centralteam.local",
      passwordHash: staffPasswordHash,
      roleId: staffRoleId,
      status: "ACTIVE",
      locale: "ar",
      departmentId: departmentIdByName.get("التصميم"),
    },
  });
  // One INVITED user, so Team page's status badge and the "invite" flow's
  // end state both have something real to show.
  await prisma.user.upsert({
    where: { email: "invited@centralteam.local" },
    update: {},
    create: {
      name: "خالد الدوسري",
      email: "invited@centralteam.local",
      passwordHash: staffPasswordHash,
      roleId: staffRoleId,
      status: "INVITED",
      locale: "ar",
    },
  });

  // ---------------------------------------------------------------------
  // Third client — gives internal list/filter views (Clients, Requests,
  // Tasks, Deliverables) real multi-client variety beyond the two used for
  // portal isolation testing.
  // ---------------------------------------------------------------------
  console.log("Seeding third demo client, project and scope...");
  const thirdClient = await prisma.client.upsert({
    where: { id: "demo-client-food" },
    update: {},
    create: {
      id: "demo-client-food",
      companyName: "مؤسسة الروابي للأغذية",
      industry: "الأغذية والمشروبات",
      email: "contact@rawabi-food.example",
      phone: "+966511111111",
      status: "ACTIVE",
      accountManagerId: accountManagerUser.id,
    },
  });

  const advertisingType = await prisma.projectType.findUniqueOrThrow({
    where: { name: "إعلانات" },
  });

  const thirdProject = await prisma.project.upsert({
    where: { id: "demo-project-food-launch" },
    update: {},
    create: {
      id: "demo-project-food-launch",
      clientId: thirdClient.id,
      projectTypeId: advertisingType.id,
      name: "حملة إطلاق منتج غذائي جديد",
      description: "حملة إعلانية متكاملة لإطلاق خط منتجات جديد",
      status: "IN_PROGRESS",
      priority: "URGENT",
      ownerId: projectManagerUser.id,
      accountManagerId: accountManagerUser.id,
      startDate: daysAgo(10),
      dueDate: daysFromNow(25),
    },
  });

  const thirdScope = await prisma.projectScope.upsert({
    where: { id: "demo-scope-3" },
    update: {},
    create: { id: "demo-scope-3", projectId: thirdProject.id, version: 1, status: "APPROVED" },
  });
  const thirdScopeItems: {
    id: string;
    category: Parameters<typeof prisma.scopeItem.create>[0]["data"]["category"];
    name: string;
    quantity: number;
    unit: string;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  }[] = [
    { id: "demo-si-food-strategy", category: "MARKETING_STRATEGY", name: "استراتيجية الإطلاق", quantity: 1, unit: "مستند", status: "COMPLETED" },
    { id: "demo-si-food-design", category: "DESIGN", name: "تصميمات العبوة والحملة", quantity: 8, unit: "تصميم", status: "IN_PROGRESS" },
    { id: "demo-si-food-video", category: "VIDEO", name: "فيديو إعلاني رئيسي", quantity: 1, unit: "فيديو", status: "IN_PROGRESS" },
    { id: "demo-si-food-media", category: "MEDIA_BUYING", name: "الشراء الإعلاني", quantity: 1, unit: "حملة", status: "PLANNED" },
  ];
  for (const item of thirdScopeItems) {
    await prisma.scopeItem.upsert({
      where: { id: item.id },
      update: { unit: item.unit },
      create: {
        id: item.id,
        projectScopeId: thirdScope.id,
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
      },
    });
  }

  console.log("Seeding additional tasks across projects...");
  const moreTasks: {
    id: string;
    projectId: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "INTERNAL_REVIEW" | "COMPLETED";
    assigneeId: string;
    dueDate: Date;
  }[] = [
    { id: "demo-task-food-design", projectId: thirdProject.id, title: "تصميم العبوة النهائية", status: "IN_PROGRESS", assigneeId: staffUser.id, dueDate: daysFromNow(5) },
    { id: "demo-task-food-video", projectId: thirdProject.id, title: "تصوير الإعلان الرئيسي", status: "TODO", assigneeId: staffUser.id, dueDate: daysFromNow(12) },
    { id: "demo-task-food-media-plan", projectId: thirdProject.id, title: "إعداد خطة الشراء الإعلاني", status: "IN_PROGRESS", assigneeId: projectManagerUser.id, dueDate: daysFromNow(7) },
    { id: "demo-task-branding-brief", projectId: secondProject.id, title: "إعداد ملخص الهوية البصرية", status: "INTERNAL_REVIEW", assigneeId: projectManagerUser.id, dueDate: daysFromNow(2) },
    { id: "demo-task-brochure-followup", projectId: demoProject.id, title: "متابعة طباعة البروشور", status: "IN_PROGRESS", assigneeId: staffUser.id, dueDate: daysFromNow(6) },
  ];
  for (const task of moreTasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        status: task.status,
        assigneeId: task.assigneeId,
        clientVisible: true,
        dueDate: task.dueDate,
      },
    });
  }

  console.log("Seeding additional deliverables and campaigns...");
  const foodDeliverable = await prisma.deliverable.upsert({
    where: { id: "demo-deliverable-food-packaging" },
    update: {},
    create: {
      id: "demo-deliverable-food-packaging",
      projectId: thirdProject.id,
      title: "تصميم العبوة - مسودة أولى",
      category: "DESIGN",
      type: "PDF",
      status: "IN_REVIEW",
      version: 1,
    },
  });
  await prisma.asset.upsert({
    where: { id: "demo-asset-food-packaging" },
    update: {},
    create: {
      id: "demo-asset-food-packaging",
      deliverableId: foodDeliverable.id,
      projectId: thirdProject.id,
      clientId: thirdClient.id,
      fileName: "packaging-draft-v1.pdf",
      fileUrl: "/file.svg",
      fileType: "application/pdf",
      uploadedById: staffUser.id,
    },
  });

  const foodCampaign = await prisma.campaign.upsert({
    where: { id: "demo-campaign-food-launch" },
    update: {},
    create: {
      id: "demo-campaign-food-launch",
      projectId: thirdProject.id,
      name: "حملة إطلاق المنتج - ميتا وجوجل",
      platform: "GOOGLE",
      status: "ACTIVE",
      objective: "توليد مبيعات مباشرة عبر المتجر الإلكتروني",
      budget: 12000,
      currency: "SAR",
      startDate: daysAgo(8),
      endDate: daysFromNow(22),
    },
  });
  await prisma.campaignMetric.upsert({
    where: { campaignId: foodCampaign.id },
    update: {},
    create: {
      campaignId: foodCampaign.id,
      spend: 3400,
      impressions: 210000,
      reach: 150000,
      clicks: 5200,
      leads: 180,
      conversions: 64,
      revenue: 28800,
      currency: "SAR",
    },
  });

  const pausedCampaign = await prisma.campaign.upsert({
    where: { id: "demo-campaign-branding-teaser" },
    update: {},
    create: {
      id: "demo-campaign-branding-teaser",
      projectId: secondProject.id,
      name: "حملة تشويقية لإطلاق الهوية",
      platform: "TIKTOK",
      status: "PAUSED",
      objective: "بناء الوعي قبل إطلاق الهوية الجديدة",
      budget: 3000,
      currency: "SAR",
      startDate: daysAgo(30),
      endDate: daysAgo(2),
    },
  });
  await prisma.campaignMetric.upsert({
    where: { campaignId: pausedCampaign.id },
    update: {},
    create: {
      campaignId: pausedCampaign.id,
      spend: 2950,
      impressions: 98000,
      reach: 71000,
      clicks: 2100,
      leads: 30,
      conversions: 5,
      revenue: 2500,
      currency: "SAR",
    },
  });

  console.log("Seeding leads...");
  const leads: {
    id: string;
    clientId: string;
    projectId?: string;
    campaignId?: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
    assignedToId: string;
  }[] = [
    { id: "demo-lead-1", clientId: thirdClient.id, projectId: thirdProject.id, campaignId: foodCampaign.id, name: "عبدالله الشمري", email: "abdullah@example.com", phone: "+966522222221", source: "Google Ads", status: "NEW", assignedToId: staffUser.id },
    { id: "demo-lead-2", clientId: thirdClient.id, projectId: thirdProject.id, campaignId: foodCampaign.id, name: "نورة العنزي", email: "noura@example.com", phone: "+966522222222", source: "Google Ads", status: "CONTACTED", assignedToId: staffUser.id },
    { id: "demo-lead-3", clientId: demoClient.id, name: "ماجد الغامدي", email: "majed@example.com", phone: "+966522222223", source: "Referral", status: "QUALIFIED", assignedToId: accountManagerUser.id },
    { id: "demo-lead-4", clientId: secondClient.id, name: "ريم القرني", email: "reem@example.com", phone: "+966522222224", source: "Website form", status: "CONVERTED", assignedToId: accountManagerUser.id },
    { id: "demo-lead-5", clientId: thirdClient.id, name: "تركي الزهراني", email: "turki@example.com", phone: "+966522222225", source: "TikTok Ads", status: "DISQUALIFIED", assignedToId: projectManagerUser.id },
  ];
  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: {},
      create: {
        id: lead.id,
        clientId: lead.clientId,
        projectId: lead.projectId,
        campaignId: lead.campaignId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        assignedToId: lead.assignedToId,
      },
    });
  }

  console.log("Seeding opportunities...");
  const opportunities: {
    id: string;
    clientId: string;
    projectId?: string;
    leadId?: string;
    title: string;
    stage: "NEW" | "QUALIFYING" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
    status: "OPEN" | "WON" | "LOST";
    value: number;
    probability: number;
    ownerId: string;
  }[] = [
    { id: "demo-opp-1", clientId: demoClient.id, leadId: "demo-lead-3", title: "تجديد العقد السنوي", stage: "NEW", status: "OPEN", value: 45000, probability: 20, ownerId: accountManagerUser.id },
    { id: "demo-opp-2", clientId: thirdClient.id, projectId: thirdProject.id, leadId: "demo-lead-1", title: "توسيع نطاق حملة الإطلاق", stage: "QUALIFYING", status: "OPEN", value: 18000, probability: 40, ownerId: accountManagerUser.id },
    { id: "demo-opp-3", clientId: secondClient.id, title: "مشروع الهوية البصرية الكاملة", stage: "PROPOSAL", status: "OPEN", value: 32000, probability: 60, ownerId: adminUser.id },
    { id: "demo-opp-4", clientId: thirdClient.id, title: "حملة إعلانية إضافية للربع القادم", stage: "NEGOTIATION", status: "OPEN", value: 25000, probability: 75, ownerId: accountManagerUser.id },
    { id: "demo-opp-5", clientId: demoClient.id, title: "حزمة تسويق إضافية", stage: "WON", status: "WON", value: 15000, probability: 100, ownerId: adminUser.id },
    { id: "demo-opp-6", clientId: secondClient.id, title: "عرض سعر لم يُقبل", stage: "LOST", status: "LOST", value: 9000, probability: 0, ownerId: accountManagerUser.id },
  ];
  for (const opp of opportunities) {
    await prisma.opportunity.upsert({
      where: { id: opp.id },
      update: {},
      create: {
        id: opp.id,
        clientId: opp.clientId,
        projectId: opp.projectId,
        leadId: opp.leadId,
        title: opp.title,
        stage: opp.stage,
        status: opp.status,
        value: opp.value,
        currency: "SAR",
        probability: opp.probability,
        expectedCloseDate: daysFromNow(30),
        ownerId: opp.ownerId,
      },
    });
  }

  console.log("Seeding integrations...");
  const integrations: {
    id: string;
    clientId: string;
    provider: "META_ADS" | "GOOGLE_ADS" | "GOOGLE_ANALYTICS" | "TIKTOK_ADS" | "WHATSAPP" | "OTHER";
    status: "CONNECTED" | "DISCONNECTED" | "ERROR";
    connectedById?: string;
  }[] = [
    { id: "demo-integration-1", clientId: demoClient.id, provider: "META_ADS", status: "CONNECTED", connectedById: adminUser.id },
    { id: "demo-integration-2", clientId: thirdClient.id, provider: "GOOGLE_ADS", status: "CONNECTED", connectedById: accountManagerUser.id },
    { id: "demo-integration-3", clientId: secondClient.id, provider: "GOOGLE_ANALYTICS", status: "DISCONNECTED" },
    { id: "demo-integration-4", clientId: thirdClient.id, provider: "WHATSAPP", status: "DISCONNECTED" },
    { id: "demo-integration-5", clientId: demoClient.id, provider: "TIKTOK_ADS", status: "ERROR" },
  ];
  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { id: integration.id },
      update: {},
      create: {
        id: integration.id,
        clientId: integration.clientId,
        provider: integration.provider,
        status: integration.status,
        connectedById: integration.connectedById,
      },
    });
  }

  console.log("Seeding comments...");
  await prisma.comment.upsert({
    where: { id: "demo-comment-1" },
    update: {},
    create: {
      id: "demo-comment-1",
      entityType: "REQUEST",
      entityId: "demo-request-banner",
      authorId: clientUser.id,
      body: "هل يمكن أن يكون البانر بنفس ألوان الحملة الحالية؟",
    },
  });
  await prisma.comment.upsert({
    where: { id: "demo-comment-2" },
    update: {},
    create: {
      id: "demo-comment-2",
      entityType: "REQUEST",
      entityId: "demo-request-banner",
      authorId: accountManagerUser.id,
      body: "بالتأكيد، سنلتزم بنفس هوية الحملة الحالية في التصميم.",
    },
  });

  console.log("Done.");
  console.log("  Internal admin login: admin@centralteam.local / Admin123!");
  console.log("  Internal account manager login: am@centralteam.local / Staff123!");
  console.log("  Internal project manager login: pm@centralteam.local / Staff123!");
  console.log("  Internal staff login: staff@centralteam.local / Staff123!");
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
