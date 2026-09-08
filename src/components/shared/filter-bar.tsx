"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ALL = "__all__";

export type FilterDef = {
  key: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

/**
 * Generic URL-search-param-driven filter bar — every list page's server
 * component already reads these same param names out of `searchParams` and
 * feeds them straight into a Prisma `where`, so this component only ever
 * needs to push new query strings, never own any server state itself.
 */
export function FilterBar({
  filters,
  dateKey,
  resetLabel,
}: {
  filters: FilterDef[];
  /** Optional due-date filter, rendered as a plain date input. */
  dateKey?: string;
  resetLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasActiveFilters = filters.some((f) => searchParams.get(f.key)) || (dateKey && searchParams.get(dateKey));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ALL}
          onValueChange={(value) => setParam(filter.key, value ?? ALL)}
          items={{ [ALL]: filter.placeholder, ...Object.fromEntries(filter.options.map((o) => [o.value, o.label])) }}
        >
          <SelectTrigger className="w-auto min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{filter.placeholder}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {dateKey && (
        <Input
          type="date"
          className="w-auto"
          value={searchParams.get(dateKey) ?? ""}
          onChange={(e) => setParam(dateKey, e.target.value)}
        />
      )}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="size-4" />
          {resetLabel}
        </Button>
      )}
    </div>
  );
}
