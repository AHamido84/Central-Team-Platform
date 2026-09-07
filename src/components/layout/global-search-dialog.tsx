"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { globalSearchAction, type GlobalSearchResult } from "@/lib/actions/search-actions";

const EMPTY: GlobalSearchResult = {
  clients: [],
  projects: [],
  requests: [],
  tasks: [],
  deliverables: [],
};

export function GlobalSearchDialog() {
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult>(EMPTY);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const next = await globalSearchAction(query);
        setResults(next);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  // Derived, not stored: a short/empty query always reads as "no results"
  // even if `results` still holds a previous search's response — avoids
  // needing a synchronous setState in the effect above to clear it.
  const effectiveResults = query.trim().length < 2 ? EMPTY : results;

  const hasResults =
    effectiveResults.clients.length +
      effectiveResults.projects.length +
      effectiveResults.requests.length +
      effectiveResults.tasks.length +
      effectiveResults.deliverables.length >
    0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">{t("trigger")}</span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DialogContent className="top-[20%] translate-y-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("placeholder")}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
          />
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {query.trim().length >= 2 && !isPending && !hasResults && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>
            )}
            <SearchSection
              label={t("sections.clients")}
              items={effectiveResults.clients.map((c) => ({ id: c.id, label: c.label, href: `/clients/${c.id}` }))}
              onNavigate={() => setOpen(false)}
            />
            <SearchSection
              label={t("sections.projects")}
              items={effectiveResults.projects.map((p) => ({
                id: p.id,
                label: p.label,
                sublabel: p.sublabel,
                href: `/projects/${p.id}`,
              }))}
              onNavigate={() => setOpen(false)}
            />
            <SearchSection
              label={t("sections.requests")}
              items={effectiveResults.requests.map((r) => ({
                id: r.id,
                label: r.label,
                sublabel: r.sublabel,
                href: `/requests/${r.id}`,
              }))}
              onNavigate={() => setOpen(false)}
            />
            <SearchSection
              label={t("sections.tasks")}
              items={effectiveResults.tasks.map((task) => ({
                id: task.id,
                label: task.label,
                sublabel: task.sublabel,
              }))}
              onNavigate={() => setOpen(false)}
            />
            <SearchSection
              label={t("sections.deliverables")}
              items={effectiveResults.deliverables.map((d) => ({
                id: d.id,
                label: d.label,
                sublabel: d.sublabel,
              }))}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchSection({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: { id: string; label: string; sublabel?: string; href?: string }[];
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="px-1 text-xs font-medium text-muted-foreground">{label}</p>
      {items.map((item) =>
        item.href ? (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="flex flex-col rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <span className="font-medium">{item.label}</span>
            {item.sublabel && <span className="text-xs text-muted-foreground">{item.sublabel}</span>}
          </Link>
        ) : (
          <div key={item.id} className="flex flex-col rounded-md px-2 py-1.5 text-sm">
            <span className="font-medium">{item.label}</span>
            {item.sublabel && <span className="text-xs text-muted-foreground">{item.sublabel}</span>}
          </div>
        ),
      )}
    </div>
  );
}
