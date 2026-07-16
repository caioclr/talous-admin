"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/pagination";
import { CvmAcronym } from "@/components/cvm-acronym";
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
import {
  listITRDFPFilingsWithValidation,
  triggerITRDFPSync,
} from "@/lib/services/admin/cvm-itr-dfp";
import type {
  FilingSummaryWithValidation,
  ValidationStatus,
} from "@/lib/services/admin/types";

function ValidationBadge({ status }: { status: ValidationStatus }) {
  if (status === "valid") {
    return (
      <Badge variant="success" className="gap-1">
        <Check className="size-3" />
        Validado
      </Badge>
    );
  }

  return <Badge variant="warning">Pendente</Badge>;
}

const columns: DataTableColumn<FilingSummaryWithValidation>[] = [
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
    key: "status",
    header: "Status",
    render: (row) => <ValidationBadge status={row.validation.status} />,
  },
  {
    key: "detail",
    header: "Validacao",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/itr-dfp/validate?cd_cvm=${row.cd_cvm}&doc_type=${row.doc_type}&reference_date=${row.reference_date}&grupo_dfr=${row.grupo_dfr}&version=${row.version}`}
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [cdCvm, setCdCvm] = useState("");
  const [docType, setDocType] = useState("");
  const [grupoDfr, setGrupoDfr] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [refDateFrom, setRefDateFrom] = useState("");
  const [refDateTo, setRefDateTo] = useState("");
  const [syncDocType, setSyncDocType] = useState("itr");
  const [syncYear, setSyncYear] = useState(new Date().getFullYear().toString());

  const filingsQuery = useQuery({
    queryKey: [
      "cvm",
      "itr-dfp",
      "filings",
      { page, pageSize, cdCvm, docType, grupoDfr, validationStatus, refDateFrom, refDateTo },
    ],
    queryFn: () =>
      listITRDFPFilingsWithValidation({
        page,
        page_size: pageSize,
        cd_cvm: cdCvm ? Number(cdCvm) : undefined,
        doc_type: docType || undefined,
        grupo_dfr: grupoDfr || undefined,
        validation_status: (validationStatus || undefined) as ValidationStatus | undefined,
        ref_date_from: toIsoDate(refDateFrom),
        ref_date_to: toIsoDate(refDateTo),
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
    const filings = filingsQuery.data?.items ?? [];
    return {
      // `total` vem do envelope (todos os filings do filtro); as demais metricas
      // sao da pagina carregada.
      total: filingsQuery.data?.pagination.total ?? 0,
      companies: new Set(filings.map((item) => item.cd_cvm)).size,
      valid: filings.filter((item) => item.validation.status === "valid").length,
      pending: filings.filter((item) => item.validation.status === "pending").length,
    };
  }, [filingsQuery.data]);

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              S01 · Moderacao CVM
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Validacao de filings <CvmAcronym sigla="ITR/DFP" />
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Conferencia interna por amostragem. Abra o demonstrativo de uma empresa/periodo, leia{" "}
              <CvmAcronym sigla="DRE" />/<CvmAcronym sigla="DFC" />/<CvmAcronym sigla="BP" /> e marque
              como valido. O selo e consultivo: nao altera o dado nem o app do usuario final.
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
                <AlertDialogTitle>Disparar sincronizacao manual?</AlertDialogTitle>
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
                <AlertDialogAction
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? "Enfileirando..." : "Confirmar sync"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Filings (total)" value={String(summary.total)} />
          <MetricCard label="Empresas na pagina" value={String(summary.companies)} />
          <MetricCard label="Validados na pagina" value={String(summary.valid)} />
          <MetricCard label="Pendentes na pagina" value={String(summary.pending)} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de conferencia</CardTitle>
          <CardDescription>
            Filtre por status de validacao para amostrar pendentes ou revisar validados por periodo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              type="number"
              placeholder="cd_cvm"
              aria-label="cd_cvm"
              value={cdCvm}
              onChange={(event) => {
                setPage(1);
                setCdCvm(event.target.value);
              }}
            />
          </div>

          <Select
            aria-label="Status de validacao"
            value={validationStatus}
            onChange={(event) => {
              setPage(1);
              setValidationStatus(event.target.value);
            }}
          >
            <option value="">Todos status</option>
            <option value="pending">Pendente</option>
            <option value="valid">Validado</option>
          </Select>

          <Select
            aria-label="Doc type"
            value={docType}
            onChange={(event) => {
              setPage(1);
              setDocType(event.target.value);
            }}
          >
            <option value="">Doc type</option>
            <option value="itr">ITR</option>
            <option value="dfp">DFP</option>
          </Select>

          <Select
            aria-label="Grupo DFR"
            value={grupoDfr}
            onChange={(event) => {
              setPage(1);
              setGrupoDfr(event.target.value);
            }}
          >
            <option value="">Grupo DFR</option>
            <option value="consolidado">consolidado</option>
            <option value="individual">individual</option>
          </Select>

          <Input
            type="date"
            aria-label="Referencia de"
            value={refDateFrom}
            onChange={(event) => {
              setPage(1);
              setRefDateFrom(event.target.value);
            }}
          />
          <Input
            type="date"
            aria-label="Referencia ate"
            value={refDateTo}
            onChange={(event) => {
              setPage(1);
              setRefDateTo(event.target.value);
            }}
          />
        </CardContent>
      </Card>

      {filingsQuery.isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Nao foi possivel carregar os filings. {filingsQuery.error?.message}
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filingsQuery.data?.items ?? []}
          loading={filingsQuery.isLoading}
          pagination={filingsQuery.data?.pagination}
          onPageChange={setPage}
          pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
          getRowKey={(row, index) =>
            `${row.cd_cvm}-${row.doc_type}-${row.reference_date}-${row.grupo_dfr}-${row.version}-${index}`
          }
          emptyMessage="Nenhum filing encontrado para os filtros informados."
        />
      )}
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
