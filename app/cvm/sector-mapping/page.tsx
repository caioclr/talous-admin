"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SectorTree } from "@/components/sectors/sector-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listAdminCompanies } from "@/lib/services/admin/cvm-registry";
import {
  deleteSectorMapping,
  listSectorMappings,
  listUnmappedSectors,
  upsertSectorMapping,
} from "@/lib/services/admin/cvm-registry";
import {
  createSector,
  createSubsector,
  deleteSector,
  deleteSubsector,
  listSectors,
  reassignCompany,
  updateSector,
  updateSubsector,
} from "@/lib/services/admin/sectors";
import type {
  AdminCompanySummary,
  CVMSectorMappingResponse,
  SectorWithSubsectorsResponse,
} from "@/lib/services/admin/types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const taxonomySchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(100, "Use no maximo 100 caracteres."),
  // Slug opcional: backend deriva do nome quando ausente. String vazia = ausente.
  slug: z.string().max(100, "Use no maximo 100 caracteres.").optional().or(z.literal("")),
});

type TaxonomyValues = z.infer<typeof taxonomySchema>;

const mappingSchema = z.object({
  cvm_setor_atividade: z
    .string()
    .min(1, "Informe o setor CVM.")
    .max(255, "Use no maximo 255 caracteres."),
  internal_sector_slug: z
    .string()
    .min(1, "Informe o slug interno.")
    .max(100, "Use no maximo 100 caracteres."),
  notes: z.string().max(500, "Use no maximo 500 caracteres.").optional().or(z.literal("")),
});

type MappingValues = z.infer<typeof mappingSchema>;

// Estado do dialog de setor/subsetor.
type TaxonomyDialogState =
  | { kind: "create-sector" }
  | { kind: "edit-sector"; sector: SectorWithSubsectorsResponse }
  | { kind: "create-subsector"; sectorId: string; sectorName: string }
  | {
      kind: "edit-subsector";
      sectorId: string;
      subsectorId: string;
      name: string;
      slug: string;
    }
  | null;

// Sentinela para "limpar subsetor" no <select> (string vazia ja e usada por
// "nenhum filtro", entao usamos um valor explicito).
const NO_SUBSECTOR = "__none__";

export default function SectorMappingPage() {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Taxonomia: setores + subsetores
  // -------------------------------------------------------------------------
  const sectorsQuery = useQuery({
    queryKey: ["admin", "sectors"],
    queryFn: listSectors,
  });

  const [taxonomyDialog, setTaxonomyDialog] = useState<TaxonomyDialogState>(null);
  const taxonomyForm = useForm<TaxonomyValues>({
    resolver: zodResolver(taxonomySchema),
    defaultValues: { name: "", slug: "" },
  });

  function invalidateSectors() {
    queryClient.invalidateQueries({ queryKey: ["admin", "sectors"] });
  }

  function closeTaxonomyDialog() {
    setTaxonomyDialog(null);
    taxonomyForm.reset({ name: "", slug: "" });
  }

  const taxonomyMutation = useMutation({
    mutationFn: async (values: TaxonomyValues) => {
      const slug = values.slug ? values.slug : undefined;
      if (!taxonomyDialog) {
        throw new Error("Nenhuma acao de taxonomia ativa.");
      }
      switch (taxonomyDialog.kind) {
        case "create-sector":
          return createSector({ name: values.name, slug });
        case "edit-sector":
          return updateSector(taxonomyDialog.sector.id, { name: values.name, slug });
        case "create-subsector":
          return createSubsector(taxonomyDialog.sectorId, { name: values.name, slug });
        case "edit-subsector":
          return updateSubsector(taxonomyDialog.sectorId, taxonomyDialog.subsectorId, {
            name: values.name,
            slug,
          });
      }
    },
    onSuccess: () => {
      toast.success("Taxonomia atualizada.");
      invalidateSectors();
      closeTaxonomyDialog();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (sectorId: string) => deleteSector(sectorId),
    onSuccess: () => {
      toast.success("Setor removido.");
      invalidateSectors();
    },
    // 409 com dependencias: o detail do backend explica o que bloqueia.
    onError: (error) => toast.error(error.message),
  });

  const deleteSubsectorMutation = useMutation({
    mutationFn: (vars: { sectorId: string; subsectorId: string }) =>
      deleteSubsector(vars.sectorId, vars.subsectorId),
    onSuccess: () => {
      toast.success("Subsetor removido.");
      invalidateSectors();
    },
    onError: (error) => toast.error(error.message),
  });

  function openCreateSector() {
    taxonomyForm.reset({ name: "", slug: "" });
    setTaxonomyDialog({ kind: "create-sector" });
  }

  function openEditSector(sector: SectorWithSubsectorsResponse) {
    taxonomyForm.reset({ name: sector.name, slug: sector.slug });
    setTaxonomyDialog({ kind: "edit-sector", sector });
  }

  function openCreateSubsector(sector: SectorWithSubsectorsResponse) {
    taxonomyForm.reset({ name: "", slug: "" });
    setTaxonomyDialog({
      kind: "create-subsector",
      sectorId: sector.id,
      sectorName: sector.name,
    });
  }

  function openEditSubsector(
    sectorId: string,
    sub: { id: string; name: string; slug: string },
  ) {
    taxonomyForm.reset({ name: sub.name, slug: sub.slug });
    setTaxonomyDialog({
      kind: "edit-subsector",
      sectorId,
      subsectorId: sub.id,
      name: sub.name,
      slug: sub.slug,
    });
  }

  const taxonomyDialogTitle =
    taxonomyDialog?.kind === "create-sector"
      ? "Novo setor"
      : taxonomyDialog?.kind === "edit-sector"
        ? "Editar setor"
        : taxonomyDialog?.kind === "create-subsector"
          ? "Novo subsetor"
          : taxonomyDialog?.kind === "edit-subsector"
            ? "Editar subsetor"
            : "";

  const taxonomyDialogDescription =
    taxonomyDialog?.kind === "create-subsector"
      ? `Subsetor sob "${taxonomyDialog.sectorName}". Slug opcional (derivado do nome).`
      : "Slug opcional: derivado do nome quando vazio.";

  // -------------------------------------------------------------------------
  // Reatribuicao de empresa
  // -------------------------------------------------------------------------
  const sectors = useMemo(() => sectorsQuery.data ?? [], [sectorsQuery.data]);

  const [companySearch, setCompanySearch] = useState("");
  const deferredCompanySearch = useDeferredValue(companySearch);

  const companiesQuery = useQuery({
    queryKey: ["admin", "sectors", "reassign-companies", deferredCompanySearch],
    queryFn: () =>
      listAdminCompanies({
        search: deferredCompanySearch || undefined,
        page: 1,
        page_size: 10,
        b3_only: true,
      }),
    enabled: deferredCompanySearch.trim().length >= 2,
  });

  const [reassignTarget, setReassignTarget] = useState<AdminCompanySummary | null>(null);
  const [reassignSectorId, setReassignSectorId] = useState<string>("");
  // "" = nao mexer no subsetor; NO_SUBSECTOR = limpar; uuid = definir.
  const [reassignSubsectorId, setReassignSubsectorId] = useState<string>("");

  const reassignSubsectors = useMemo(
    () => sectors.find((s) => s.id === reassignSectorId)?.subsectors ?? [],
    [sectors, reassignSectorId],
  );

  function openReassign(company: AdminCompanySummary) {
    setReassignTarget(company);
    setReassignSectorId("");
    setReassignSubsectorId("");
  }

  const reassignMutation = useMutation({
    mutationFn: async () => {
      if (!reassignTarget) {
        throw new Error("Nenhuma empresa selecionada.");
      }
      // Monta o body com a semantica do contrato:
      //  - sem sector_id     => mantem setor;
      //  - subsector_id ""    => omite a chave (mantem subsetor);
      //  - NO_SUBSECTOR       => subsector_id: null (limpa);
      //  - uuid               => subsector_id: uuid (define).
      const body: { sector_id?: string; subsector_id?: string | null } = {};
      if (reassignSectorId) {
        body.sector_id = reassignSectorId;
      }
      if (reassignSubsectorId === NO_SUBSECTOR) {
        body.subsector_id = null;
      } else if (reassignSubsectorId) {
        body.subsector_id = reassignSubsectorId;
      }
      if (body.sector_id === undefined && !("subsector_id" in body)) {
        throw new Error("Escolha um novo setor ou subsetor para reatribuir.");
      }
      return reassignCompany(reassignTarget.id, body);
    },
    onSuccess: () => {
      toast.success("Empresa reatribuida.");
      invalidateSectors();
      setReassignTarget(null);
    },
    // 422: subsetor de outro setor. O detail do backend e exibido.
    onError: (error) => toast.error(error.message),
  });

  // -------------------------------------------------------------------------
  // Mapeamento CVM -> interno (preservado)
  // -------------------------------------------------------------------------
  const [mappingOpen, setMappingOpen] = useState(false);
  const mappingForm = useForm<MappingValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: { cvm_setor_atividade: "", internal_sector_slug: "", notes: "" },
  });

  const mappingsQuery = useQuery({
    queryKey: ["cvm", "sector-mapping"],
    queryFn: listSectorMappings,
  });

  const unmappedQuery = useQuery({
    queryKey: ["cvm", "sector-mapping", "unmapped"],
    queryFn: listUnmappedSectors,
  });

  const upsertMutation = useMutation({
    mutationFn: (values: MappingValues) =>
      upsertSectorMapping({ ...values, notes: values.notes || undefined }),
    onSuccess: () => {
      toast.success("Mapeamento salvo.");
      queryClient.invalidateQueries({ queryKey: ["cvm", "sector-mapping"] });
      setMappingOpen(false);
      mappingForm.reset();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (cvmSetor: string) => deleteSectorMapping(cvmSetor),
    onSuccess: () => {
      toast.success("Mapeamento removido.");
      queryClient.invalidateQueries({ queryKey: ["cvm", "sector-mapping"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const mappingColumns: DataTableColumn<CVMSectorMappingResponse>[] = [
    { key: "cvm", header: "Setor CVM", render: (row) => row.cvm_setor_atividade },
    { key: "slug", header: "Slug interno", render: (row) => row.internal_sector_slug },
    { key: "notes", header: "Notas", render: (row) => row.notes ?? "—" },
    {
      key: "actions",
      header: "Acoes",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              mappingForm.reset({
                cvm_setor_atividade: row.cvm_setor_atividade,
                internal_sector_slug: row.internal_sector_slug,
                notes: row.notes ?? "",
              });
              setMappingOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Editar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(event) => event.stopPropagation()}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover mapeamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  O setor `{row.cvm_setor_atividade}` voltara a aparecer como pendente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMappingMutation.mutate(row.cvm_setor_atividade)}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ============ Taxonomia setor/subsetor ============ */}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Taxonomia setor / subsetor</CardTitle>
            <CardDescription>
              Setores e subsetores proprios. Score e DCF continuam por setor; o subsetor
              e camada organizacional. A contagem de empresas vem do backend.
            </CardDescription>
          </div>
          <Button type="button" className="rounded-full" onClick={openCreateSector}>
            <Plus className="size-4" />
            Novo setor
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sectorsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando setores...</p>
          ) : null}

          {sectorsQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Falha ao carregar setores: {(sectorsQuery.error as Error).message}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => sectorsQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : null}

          {!sectorsQuery.isLoading && !sectorsQuery.isError && sectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum setor cadastrado.</p>
          ) : null}

          {sectors.map((sector) => (
            <div
              key={sector.id}
              className="rounded-3xl border border-border/70 bg-background/60 p-4"
              data-testid="sector-card"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {sector.name}{" "}
                    <span className="text-xs text-muted-foreground">({sector.slug})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sector.company_count} empresa(s) · {sector.subsectors.length} subsetor(es)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateSubsector(sector)}
                  >
                    <Plus className="size-4" />
                    Subsetor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditSector(sector)}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Trash2 className="size-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover setor &quot;{sector.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O backend bloqueia (409) se houver empresas, subsetores,
                          mapeamento CVM ou config de score/DCF apontando para ele.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSectorMutation.mutate(sector.id)}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {sector.subsectors.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1 border-t border-border/50 pt-3">
                  {sector.subsectors.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex flex-col gap-2 rounded-2xl bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      data-testid="subsector-row"
                    >
                      <span className="text-sm text-foreground">
                        <FolderTree className="mr-1 inline size-3.5 text-muted-foreground" />
                        {sub.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({sub.slug}) · {sub.company_count} empresa(s)
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSubsector(sector.id, sub)}
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <Trash2 className="size-4" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remover subsetor &quot;{sub.name}&quot;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                O backend bloqueia (409) se houver empresas apontando
                                para este subsetor. Reatribua antes de remover.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteSubsectorMutation.mutate({
                                    sectorId: sector.id,
                                    subsectorId: sub.id,
                                  })
                                }
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ============ Arvore: Setor -> Subsetor -> Empresas ============ */}
      {/* Substitui o card "Reatribuir empresa", que achava a empresa por texto,
          uma a uma. Aquele fluxo nunca revelaria o que medimos: 37 empresas com
          setor provavelmente errado (a RANI3, que e papel, dentro de "Bancos"),
          98 sem subsetor, 25 nomes de subsetor repetidos entre setores. Para ver
          isso e preciso ver o conjunto. */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas por setor e subsetor</CardTitle>
          <CardDescription>
            Expanda um setor para ver as empresas agrupadas por subsetor, incluindo as
            que estao sem subsetor. Mover uma empresa daqui carimba a curadoria: o job
            semanal da B3 deixa de reatribuir o subsetor dela.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorTree sectors={sectors} loading={sectorsQuery.isLoading} />
        </CardContent>
      </Card>

      {/* ============ Mapeamento CVM -> interno (preservado) ============ */}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Mapeamento setorial CVM</CardTitle>
            <CardDescription>
              Associa o setor de atividade declarado na CVM ao slug interno do setor.
            </CardDescription>
          </div>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => {
              mappingForm.reset();
              setMappingOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo mapeamento
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setores pendentes</CardTitle>
          <CardDescription>
            Amostra dos setores CVM detectados em empresas, mas ainda sem slug interno associado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(unmappedQuery.data ?? []).map((item) => (
            <button
              type="button"
              key={item.cvm_setor_atividade}
              className="rounded-3xl border border-dashed border-border/80 bg-background/70 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
              onClick={() => {
                mappingForm.reset({
                  cvm_setor_atividade: item.cvm_setor_atividade,
                  internal_sector_slug: "",
                  notes: item.sample_company_names.join(", "),
                });
                setMappingOpen(true);
              }}
            >
              <p className="font-medium text-foreground">{item.cvm_setor_atividade}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.company_count} empresas · {item.sample_company_names.join(", ")}
              </p>
            </button>
          ))}

          {unmappedQuery.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum setor pendente de mapeamento.</p>
          ) : null}
        </CardContent>
      </Card>

      <DataTable
        columns={mappingColumns}
        data={mappingsQuery.data ?? []}
        loading={mappingsQuery.isLoading}
        getRowKey={(row) => row.cvm_setor_atividade}
        emptyMessage="Nenhum mapeamento cadastrado."
      />

      {/* ============ Dialog: setor/subsetor ============ */}
      <Dialog
        open={taxonomyDialog !== null}
        onOpenChange={(value) => {
          if (!value) closeTaxonomyDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{taxonomyDialogTitle}</DialogTitle>
            <DialogDescription>{taxonomyDialogDescription}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={taxonomyForm.handleSubmit((values) => taxonomyMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="taxonomy-name">Nome</Label>
              <Input id="taxonomy-name" {...taxonomyForm.register("name")} />
              {taxonomyForm.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {taxonomyForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxonomy-slug">Slug (opcional)</Label>
              <Input id="taxonomy-slug" {...taxonomyForm.register("slug")} />
              {taxonomyForm.formState.errors.slug ? (
                <p className="text-sm text-destructive">
                  {taxonomyForm.formState.errors.slug.message}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeTaxonomyDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={taxonomyMutation.isPending}>
                {taxonomyMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ Dialog: reatribuir empresa ============ */}
      <Dialog
        open={reassignTarget !== null}
        onOpenChange={(value) => {
          if (!value) setReassignTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reatribuir empresa</DialogTitle>
            <DialogDescription>
              {reassignTarget?.name}. Campos vazios mantem o valor atual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reassign-sector">Setor</Label>
              <Select
                id="reassign-sector"
                value={reassignSectorId}
                onChange={(event) => {
                  setReassignSectorId(event.target.value);
                  // Trocar de setor invalida o subsetor anterior: reseta.
                  setReassignSubsectorId("");
                }}
              >
                <option value="">Manter setor atual</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reassign-subsector">Subsetor</Label>
              <Select
                id="reassign-subsector"
                value={reassignSubsectorId}
                onChange={(event) => setReassignSubsectorId(event.target.value)}
                disabled={reassignSectorId === ""}
              >
                <option value="">Manter subsetor atual</option>
                <option value={NO_SUBSECTOR}>Limpar subsetor</option>
                {reassignSubsectors.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
              {reassignSectorId === "" ? (
                <p className="text-xs text-muted-foreground">
                  Escolha um setor para listar e definir subsetores.
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReassignTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={reassignMutation.isPending}
              onClick={() => reassignMutation.mutate()}
            >
              {reassignMutation.isPending ? "Reatribuindo..." : "Reatribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Dialog: mapeamento CVM ============ */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar mapeamento</DialogTitle>
            <DialogDescription>Faz upsert em `POST /admin/cvm/sector-mapping`.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={mappingForm.handleSubmit((values) => upsertMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="cvm_setor_atividade">Setor CVM</Label>
              <Input id="cvm_setor_atividade" {...mappingForm.register("cvm_setor_atividade")} />
              {mappingForm.formState.errors.cvm_setor_atividade ? (
                <p className="text-sm text-destructive">
                  {mappingForm.formState.errors.cvm_setor_atividade.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_sector_slug">Slug interno</Label>
              <Input id="internal_sector_slug" {...mappingForm.register("internal_sector_slug")} />
              {mappingForm.formState.errors.internal_sector_slug ? (
                <p className="text-sm text-destructive">
                  {mappingForm.formState.errors.internal_sector_slug.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" {...mappingForm.register("notes")} />
              {mappingForm.formState.errors.notes ? (
                <p className="text-sm text-destructive">
                  {mappingForm.formState.errors.notes.message}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMappingOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
