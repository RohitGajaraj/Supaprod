// OBS-10 - the /product page was retired; this holds its PortfolioBoard
// (switch/archive/restore/export/delete) inside Settings > Products. Same
// server functions, same lifecycle logic, same confirm copy.
//
// Ported to the rebuild primitives 2026-07-29. The route already draws the
// PageHead, so this owns only the two groups under it. A product is a Row
// because a Row is exactly what it is: something you click to switch to, with
// controls of its own at the trailing edge.
//
// Dropped on the way, each for a stated reason rather than taste:
//   the two `material-medium` cards, which put bordered boxes inside a surface
//     whose own sections are borderless (hard ban 5, one bordered container per
//     region);
//   the 24px bordered icon tiles for export/archive/delete (hard ban 8, and the
//     repo's plain-words button law) - they are ghost buttons that say what they
//     do;
//   the 4px progress bar, which drew the same fact the "3/8 tasks" beside it
//     already stated (hard ban 10);
//   the animate-pulse skeleton, which performed instead of confirming; Loading
//     reserves the height and says what is happening;
//   the product's north star from the row. A list row never wraps (founder
//     ruling), the counts are what a portfolio is scanned for, and the north
//     star is one click away on the product itself.
import { useServerFn } from "@tanstack/react-start";
import { Num } from "@/components/meridian/surface-parts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";
import { Actions, Block, Button, Empty, Failed, Line, Loading, Row } from "@/components/shell/primitives";
import {
  getPortfolio,
  setProjectArchived,
  exportProduct,
  deleteProject,
  createProject,
  type PortfolioProduct,
} from "@/lib/projects.functions";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fileSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

export function ProductsTab() {
  const { activeProductId, setActiveProductId, activeWorkspaceId, refreshProducts } =
    useWorkspace();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const fPortfolio = useServerFn(getPortfolio);
  const portfolio = useQuery({ queryKey: ["portfolio"], queryFn: () => fPortfolio() });

  const fArchive = useServerFn(setProjectArchived);
  const fExport = useServerFn(exportProduct);
  const fDelete = useServerFn(deleteProject);
  const fCreate = useServerFn(createProject);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["portfolio"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    void refreshProducts();
  };

  async function addProduct() {
    const name = await prompt({
      title: "New product",
      label: "Product name",
      placeholder: "e.g. Checkout v2",
      confirmLabel: "Create",
    });
    if (!name?.trim()) return;
    try {
      const res = await fCreate({
        data: { name: name.trim(), workspaceId: activeWorkspaceId ?? undefined },
      });
      refresh();
      if (res.project?.id) setActiveProductId(res.project.id);
      toast.success(`Added "${name.trim()}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create the product.");
    }
  }

  async function runExport(p: PortfolioProduct) {
    try {
      const data = await fExport({ data: { id: p.id } });
      downloadJson(`${fileSlug(p.name)}-supaprod-export.json`, data);
      toast.success(`Exported "${p.name}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't export.");
    }
  }

  async function archive(p: PortfolioProduct) {
    try {
      await fArchive({ data: { id: p.id, archive: true } });
      if (activeProductId === p.id) setActiveProductId(null);
      refresh();
      toast.success(`Archived "${p.name}".`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await fArchive({ data: { id: p.id, archive: false } });
              refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't undo.");
            }
          },
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't archive.");
    }
  }

  async function restore(p: PortfolioProduct) {
    try {
      await fArchive({ data: { id: p.id, archive: false } });
      refresh();
      toast.success(`Restored "${p.name}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't restore.");
    }
  }

  async function remove(p: PortfolioProduct) {
    const ok = await confirm({
      title: `Delete "${p.name}"?`,
      // Honest copy: the FK is `on delete set null`, so the product's signals,
      // opportunities, and specs are detached to the workspace, not destroyed.
      body: `Deletes the product. Its signals, opportunities, and specs are detached to the workspace (not destroyed); its tasks lose this product. This can't be undone. A JSON export downloads first.`,
      destructive: true,
      confirmLabel: "Export & delete",
      typedConfirm: p.name,
    });
    if (!ok) return;
    try {
      const data = await fExport({ data: { id: p.id } });
      downloadJson(`${fileSlug(p.name)}-supaprod-export.json`, data);
      await fDelete({ data: { id: p.id } });
      if (activeProductId === p.id) setActiveProductId(null);
      refresh();
      toast.success(`Deleted "${p.name}". Export downloaded.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete.");
    }
  }

  if (portfolio.isLoading) {
    return <Loading>Reading the portfolio.</Loading>;
  }

  if (portfolio.error) {
    return (
      <Failed onRetry={() => void portfolio.refetch()}>
        The portfolio did not load. {(portfolio.error as Error)?.message ?? "The read failed."}
      </Failed>
    );
  }

  const all = portfolio.data?.products ?? [];
  const active = all.filter((p) => !p.archived);
  const archived = all.filter((p) => p.archived);

  if (all.length === 0) {
    return (
      <Empty
        action={
          <Button variant="primary" onClick={addProduct}>
            New product
          </Button>
        }
      >
        A product is where signals, opportunities, and specs live. New workspaces start with one
        named after the workspace; add one here to begin.
      </Empty>
    );
  }

  return (
    <>
      <Block
        title={`Portfolio · ${active.length} product${active.length === 1 ? "" : "s"}`}
        sub={
          active.length > 1 ? "Click a product to make it the one the crew works on." : undefined
        }
      >
        {active.map((p) => {
          const isActive = p.id === activeProductId;
          return (
            <Row
              key={p.id}
              tight
              // Selection is a ring, never a fill: ember marks the human and a
              // chosen product is not one. The word "Active" carries the same
              // fact, so it survives greyscale.
              focused={isActive}
              onClick={() => setActiveProductId(p.id)}
              lead={
                <>
                  {p.name}
                  {isActive ? <span style={{ color: "var(--sp-mute)" }}> · Active</span> : null}
                </>
              }
              sub={
                <>
                  <Num>
                    {p.task_done}/{p.task_total}
                  </Num>{" "}
                  tasks · <Num>{p.signals}</Num> signals · <Num>{p.opportunities}</Num>{" "}
                  opportunities · <Num>{p.specs}</Num> specs
                </>
              }
              action={
                <>
                  <Button variant="ghost" onClick={() => runExport(p)}>
                    Export
                  </Button>
                  <Button variant="ghost" onClick={() => archive(p)}>
                    Archive
                  </Button>
                  <Button variant="ghost" onClick={() => remove(p)}>
                    Delete
                  </Button>
                </>
              }
            />
          );
        })}

        <Actions>
          <Button onClick={addProduct}>New product</Button>
        </Actions>
      </Block>

      {archived.length > 0 ? (
        <Block
          title={`Archived · ${archived.length} product${archived.length === 1 ? "" : "s"}`}
          sub="Nothing here is worked on. Restore one to bring it back into the portfolio."
        >
          {archived.map((p) => (
            <Line key={p.id} label={p.name}>
              <Button variant="ghost" onClick={() => restore(p)}>
                Restore
              </Button>
              <Button variant="ghost" onClick={() => runExport(p)}>
                Export
              </Button>
              <Button variant="ghost" onClick={() => remove(p)}>
                Delete
              </Button>
            </Line>
          ))}
        </Block>
      ) : null}
    </>
  );
}
