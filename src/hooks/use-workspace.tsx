import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accountChangedOnSwitch, shouldClearOnWorkspaceSwitch } from "./workspace-query-scope";

export type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  slug: string | null;
  created_at: string;
  // WM-M2 account link, surfaced for WM-F6c same-account move-destination
  // filtering. Optional + nullable: the workspaces query selects "*" so it is
  // present once WM-M2's schema is the deployed read schema, and absent before.
  // The move filter treats an absent/null value as "unknown" and fails open.
  account_id?: string | null;
  // Sample-data honesty: true for the rich seeded "Sample workspace" so the shell
  // can label it (a tag + a banner). Optional + nullable: the workspaces query
  // selects "*", so it is present once the is_sample column is the deployed read
  // schema, and treated as false before.
  is_sample?: boolean | null;
};

export type Product = {
  id: string;
  name: string;
  workspace_id: string;
  created_at: string;
  // The readable URL segment (/$workspaceSlug/$productSlug). Nullable because
  // the column is backfilled + trigger-generated rather than NOT NULL: a row
  // without one still opens the room through the legacy /m/<uuid> floor.
  slug: string | null;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  products: Product[];
  activeProductId: string | null;
  activeProduct: Product | null;
  /**
   * Loom W2 progressive disclosure (founder ruling 2026-07-04): the product
   * concept stays invisible until a second product exists. Consumers (the
   * AppShell switcher, any Product menu section) render product UI only when
   * this is true; capture paths keep using activeProductId, which self-selects
   * the single product.
   */
  productsVisible: boolean;
  isLoading: boolean;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveProductId: (id: string | null) => void;
  refreshWorkspaces: () => void;
  refreshProducts: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = "supaprod.workspace.active";
const PRODUCT_STORAGE_KEY = "supaprod.product.active";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceState] = useState<string | null>(null);
  const [activeProductId, setActiveProductState] = useState<string | null>(null);

  // 1. Fetch workspaces the user is a member of (RLS handles membership filtering)
  const {
    data: workspaces = [],
    isLoading: isLoadingWorkspaces,
    refetch: refreshWorkspaces,
  } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // 2. Fetch products for the active workspace
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    refetch: refreshProducts,
  } = useQuery<Product[]>({
    queryKey: ["products", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const { data, error } = await supabase
        .from("projects") // the physical table name is projects (represents products)
        .select("id, name, workspace_id, created_at, slug")
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: !!activeWorkspaceId,
  });

  // Optimistically restore the last workspace from localStorage on mount, WITHOUT
  // waiting for the workspaces query. On a cold direct-URL load this fires the
  // page's data queries (which are `enabled: !!activeWorkspaceId`) immediately, in
  // parallel with the workspaces fetch, instead of after two sequential round
  // trips, so a page like /brain shows its content instead of a "select workspace"
  // skeleton. Runs client-side only (no SSR hydration mismatch: the first render
  // is null on both server and client, this effect sets state after mount). The
  // validation effect below corrects a stale id once real membership loads.
  useEffect(() => {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored) setActiveWorkspaceState((cur) => cur ?? stored);
  }, []);

  // Validate against real membership once workspaces load: keep the current id if
  // it is still a workspace the user belongs to, else fall back to the first, else
  // clear (the user has no workspaces). Persists the resolved choice.
  useEffect(() => {
    if (isLoadingWorkspaces) return;

    setActiveWorkspaceState((cur) => {
      if (cur && workspaces.some((w) => w.id === cur)) return cur;
      if (workspaces.length > 0) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaces[0].id);
        return workspaces[0].id;
      }
      return null;
    });
  }, [workspaces, isLoadingWorkspaces]);

  // Initialize product when products change
  useEffect(() => {
    if (isLoadingProducts || !activeWorkspaceId) return;

    const storedProduct = localStorage.getItem(`${PRODUCT_STORAGE_KEY}.${activeWorkspaceId}`);
    if (storedProduct && products.some((p) => p.id === storedProduct)) {
      setActiveProductState(storedProduct);
    } else if (products.length > 0) {
      const defaultProduct = products[0].id;
      setActiveProductState(defaultProduct);
      localStorage.setItem(`${PRODUCT_STORAGE_KEY}.${activeWorkspaceId}`, defaultProduct);
    } else {
      setActiveProductState(null);
    }
  }, [products, isLoadingProducts, activeWorkspaceId]);

  const setActiveWorkspaceId = useCallback(
    (id: string | null) => {
      // WM-F8: on a real switch, clear every workspace-scoped query so no stale
      // data from the previous workspace flashes before the refetch (which reads
      // like a cross-workspace leak). Active observers refetch automatically
      // under the new workspace context. USER-global queries (the workspaces list,
      // profile, personal keys) are always preserved; ACCOUNT-global queries
      // (billing/connections/integrations) are preserved on a same-account switch
      // but ALSO cleared when the switch crosses accounts (WM-F8b), so a new
      // account never renders the previous account's billing/connections.
      if (id !== activeWorkspaceId) {
        // The FIRST activation (activeWorkspaceId === null) is not a switch: there is no
        // prior account whose cached data could be stale, so it must NOT clear account-global
        // queries (which would drop SSR-hydrated billing/connections on first load). Only a
        // real switch from an existing workspace can cross accounts; gate the cross-account
        // clear on that, so first mount stays byte-identical to the pre-WM-F8b behavior.
        const accountChanged =
          activeWorkspaceId !== null && accountChangedOnSwitch(workspaces, activeWorkspaceId, id);
        queryClient.removeQueries({
          predicate: (query) => shouldClearOnWorkspaceSwitch(query.queryKey, { accountChanged }),
        });
      }
      setActiveWorkspaceState(id);
      if (id) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
      // Clear product when workspace switches
      setActiveProductState(null);
    },
    [activeWorkspaceId, workspaces, queryClient],
  );

  const setActiveProductId = useCallback(
    (id: string | null) => {
      setActiveProductState(id);
      if (id && activeWorkspaceId) {
        localStorage.setItem(`${PRODUCT_STORAGE_KEY}.${activeWorkspaceId}`, id);
      } else if (activeWorkspaceId) {
        localStorage.removeItem(`${PRODUCT_STORAGE_KEY}.${activeWorkspaceId}`);
      }
    },
    [activeWorkspaceId],
  );

  // LOOM W4 perf: a stable context value. Without this, every provider render
  // handed consumers a fresh object and re-rendered the whole authed tree.
  const value = useMemo<WorkspaceContextType>(() => {
    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;
    const activeProduct = products.find((p) => p.id === activeProductId) || null;
    return {
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      products,
      activeProductId,
      activeProduct,
      productsVisible: products.length > 1,
      isLoading: isLoadingWorkspaces || isLoadingProducts,
      setActiveWorkspaceId,
      setActiveProductId,
      refreshWorkspaces,
      refreshProducts,
    };
  }, [
    workspaces,
    activeWorkspaceId,
    products,
    activeProductId,
    isLoadingWorkspaces,
    isLoadingProducts,
    setActiveWorkspaceId,
    setActiveProductId,
    refreshWorkspaces,
    refreshProducts,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
