"use client";

import { KanbanBoard, type KanbanColumn } from "@/components/portal/kanban-board";
import { updateOpportunityStageAction } from "@/lib/actions/opportunity-actions";
import type { OpportunityStage } from "@prisma/client";

type OpportunityCard = {
  id: string;
  stage: OpportunityStage;
  title: string;
  clientName: string;
  valueLabel?: string;
};

export function OpportunitiesBoard({
  columns,
  opportunities,
}: {
  columns: KanbanColumn[];
  opportunities: OpportunityCard[];
}) {
  return (
    <KanbanBoard
      columns={columns}
      items={opportunities.map((opportunity) => ({
        id: opportunity.id,
        columnId: opportunity.stage,
        title: opportunity.title,
        meta: `${opportunity.clientName}${opportunity.valueLabel ? ` · ${opportunity.valueLabel}` : ""}`,
      }))}
      onMove={(itemId, columnId) =>
        updateOpportunityStageAction(itemId, columnId as OpportunityStage)
      }
    />
  );
}
