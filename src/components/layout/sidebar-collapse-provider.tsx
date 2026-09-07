"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "internal-sidebar-collapsed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

const SidebarCollapseContext = createContext<{ collapsed: boolean; toggle: () => void } | null>(
  null,
);

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore reads localStorage safely across SSR/hydration —
  // the server snapshot is always "expanded", the client snapshot reflects
  // whatever was saved, with no setState-in-effect needed to reconcile them.
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, getSnapshot() ? "0" : "1");
      // Same-tab storage writes don't fire the "storage" event, so this
      // component wouldn't otherwise see its own change until another tab
      // does — dispatch one manually.
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    } catch {
      // Non-fatal: collapse state just won't persist across reloads.
    }
  }, []);

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

/** Returns `{ collapsed: false }` outside a provider (e.g. the portal shell,
 * which doesn't use collapse) instead of throwing, so shared nav components
 * work in both shells without every caller needing a null check. */
export function useSidebarCollapse(): { collapsed: boolean; toggle: () => void } {
  const ctx = useContext(SidebarCollapseContext);
  return ctx ?? { collapsed: false, toggle: () => {} };
}
