import { InternalDashboard } from "@/components/dashboard/internal-dashboard";

/** Thin route satisfying the spec's explicit /dashboard listing — renders
 * the exact same dashboard as "/" rather than duplicating its logic. */
export default async function InternalDashboardRoutePage() {
  return <InternalDashboard />;
}
