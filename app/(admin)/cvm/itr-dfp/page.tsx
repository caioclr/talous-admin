"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCcw, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatList, truncateHash } from "@/lib/formatters";
import { listITRDFPFilings, triggerITRDFPSync } from "@/lib/services/admin/cvm-itr-dfp";
import type { FilingSummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<FilingSummary>[] = [
  {
    key: "empresa",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.denom_cia}</p>
        <p className="text-xs text-muted-foreground">cd_cvm {row.cd_cvm}</p>
      </div>
    ),
  },
  {
    key: "documento",
    header: "Documento",
    render: (row) => (
      <div className="space-y-1">
        <Badge variant="secondary">{row.doc_type.toUpperCase()}</Badge>
        <p className="text-xs text-muted-foreground">versao {row.version}</p>
      </div>
    ),
  },
  {
    key: "ref",
    header: "Referencia",
    render: (row) => formatDate(row.reference_date),
  },
  {
    key: "grupo",
    header: "Grupo",
    render: (row) => row.grupo_dfr,
  },
  {
    key: "statements",
    header: "Demonstrativos",
    render: (row) => (
      <span className="text-xs text-muted-foreground">{formatList(row.statement_types)}</span>
    ),
  },
  {
    key: "detail",
    header: "Explorer",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/itr-dfp/companies/${row.cd_cvm}`}
      >
        Abrir
      </Link>
    ),
  },
];

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : undefined;
}

export default function ITRDFPPage() {
  const [cdCvm, setCdCvm] = useState("");
  const [docType, setDocType] = useState("");
  const [grupoDfr, setGrupoDfr] = useState("");
  const [refDateFrom, setRefDateFrom] = useState("");
  const [refDateTo, setRefDateTo] = useState("");
  const [limit, setLimit] = useState("100");
  const [syncDocType, setSyncDocType] = useState("itr");
  const [syncYear, setSyncYear] = useState(new Date().getFullYear().toString());

  const filingsQuery = useQuery({
    queryKey: ["cvm", "itr-dfp", "filings", { cdCvm, docType, grupoDfr, refDateFrom, refDateTo, limit }],
    queryFn: () =>
      listITRDFPFilings({
        cd_cvm: cdCvm ? Number(cdCvm) : undefined,
        doc_type: docType || undefined,
        grupo_dfr: grupoDfr || undefined,
        ref_date_from: toIsoDate(refDateFrom),
        ref_date_to: toIsoDate(refDateTo),
        limit: limit ? Number(limit) : 100,
      }),
  });

  const syncMutation = useMutation({
    mutationFn: () => triggerITRDFPSync(syncDocType, syncYear ? Number(syncYear) : undefined),
    onSuccess: (data) => {
      toast.success(`Sync ITR/DFP enfileirada com task_id ${truncateHash(data.task_id, 6)}.`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const summary = useMemo(() => {
    const filings = filingsQuery.data ?? [];
    return {
      total: filings.length,
      companies: new Set(filings.map((item) => item.cd_cvm)).size,
      itr: filings.filter((item) => item.doc_type === "itr").length,
      dfp: filings.filter((item) => item.doc_type === "dfp").length,
    };
  }, [filingsQuery.data]);

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Sprint 3 · ITR/DFP
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Explorer de filings estruturados e reconciliação
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Consulta filings disponíveis, árvore contábil por demonstrativo e diff entre `cvm_official`, `cvm_document` e `api_provider`.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="rounded-full">
                <RefreshCcw className="size-4" />
                Sincronizar ITR/DFP
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disparar sincronização manual?</AlertDialogTitle>
                <AlertDialogDescription>
                  O backend usa `POST /admin/cvm/itr-dfp/sync` com `doc_type` e `year`.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="sync-doc-type">
                    Tipo
                  </label>
                  <Select
                    id="sync-doc-type"
                    value={syncDocType}
                    onChange={(event) => setSyncDocType(event.target.value)}
                  >
                    <option value="itr">ITR</option>
                    <option value="dfp">DFP</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="sync-year">
                    Ano
                  </label>
                  <Input
                    id="sync-year"
                    type="number"
                    value={syncYear}
                    onChange={(event) => setSyncYear(event.target.value)}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                  {syncMutation.isPending ? "Enfileirando..." : "Confirmar sync"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Filings carregados" value={String(summary.total)} />
          <MetricCard label="Empresas distintas" value={String(summary.companies)} />
          <MetricCard label="ITR" value={String(summary.itr)} />
          <MetricCard label="DFP" value={String(summary.dfp)} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de filings</CardTitle>
          <CardDescription>
            O endpoint atual retorna lista simples com `limit`, então a navegação aqui é focada em busca e corte do dataset.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              type="number"
              placeholder="cd_cvm"
              value={cdCvm}
              onChange={(event) => setCdCvm(event.target.value)}
            />
          </div>

          <Select value={docType} onChange={(event) => setDocType(event.target.value)}>
            <option value="">Doc type</option>
            <option value="itr">ITR</option>
            <option value="dfp">DFP</option>
          </Select>

          <Select value={grupoDfr} onChange={(event) => setGrupoDfr(event.target.value)}>
            <option value="">Grupo DFR</option>
            <option value="consolidado">consolidado</option>
            <option value="individual">individual</option>
          </Select>

          <Input type="date" value={refDateFrom} onChange={(event) => setRefDateFrom(event.target.value)} />
          <Input type="date" value={refDateTo} onChange={(event) => setRefDateTo(event.target.value)} />
          <Input type="number" placeholder="limit" value={limit} onChange={(event) => setLimit(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leitura rápida</CardTitle>
          <CardDescription>
            Abra o explorer por empresa para escolher filing, statement e visualizar reconciliação.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">/filings</Badge>
          <Badge variant="secondary">/account-lines/{`{cd_cvm}`}</Badge>
          <Badge variant="secondary">/reconciliation/{`{cd_cvm}`}/{`{reference_date}`}</Badge>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filingsQuery.data ?? []}
        loading={filingsQuery.isLoading}
        getRowKey={(row, index) => `${row.cd_cvm}-${row.doc_type}-${row.reference_date}-${row.version}-${index}`}
        emptyMessage="Nenhum filing encontrado para os filtros informados."
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="metric-tile">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
