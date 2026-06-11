"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import {
  getFCASyncStatus,
  listFCADocumentos,
  triggerFCASync,
} from "@/lib/services/admin/cvm-fca";
import type { FCADocumentoSummary } from "@/lib/services/admin/types";

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const columns: DataTableColumn<FCADocumentoSummary>[] = [
  {
    key: "ref",
    header: "Referencia",
    render: (row) => (
      <div className="space-y-1">
        <p>{formatDate(row.data_referencia)}</p>
        <p className="text-xs text-muted-foreground">v{row.versao}</p>
      </div>
    ),
  },
  {
    key: "company",
    header: "Empresa",
    render: (row) =>
      row.cd_cvm !== null ? (
        <Link
          className="space-y-1 underline-offset-4 hover:underline"
          href={`/cvm/fca/companies/detail?cd_cvm=${row.cd_cvm}`}
        >
          <p className="font-medium text-foreground">{row.nome_empresarial}</p>
          <p className="text-xs text-muted-foreground">
            cd_cvm {row.cd_cvm} · CNPJ {row.cnpj_companhia}
          </p>
        </Link>
      ) : (
        <div className="space-y-1">
          <p className="font-medium text-foreground">{row.nome_empresarial}</p>
          <p className="text-xs text-muted-foreground">CNPJ {row.cnpj_companhia}</p>
        </div>
      ),
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) =>
      row.categoria_documento ? (
        <Badge variant="secondary">{row.categoria_documento}</Badge>
      ) : (
        "—"
      ),
  },
  {
    key: "recebimento",
    header: "Recebido em",
    render: (row) => formatDate(row.data_recebimento),
  },
  {
    key: "captured",
    header: "Capturado",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "detail",
    header: "Documento",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/fca/documentos/detail?id_documento=${row.id_documento}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function FCAPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [cdCvm, setCdCvm] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [year, setYear] = useState("");
  const [forceSync, setForceSync] = useState(false);
  const [syncYear, setSyncYear] = useState(String(CURRENT_YEAR));

  const cdCvmNumber = Number(cdCvm) || undefined;

  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "fca", "sync-status"],
    queryFn: getFCASyncStatus,
  });

  const documentosQuery = useQuery({
    queryKey: ["cvm", "fca", "documentos", { page, cdCvmNumber, cnpj, year }],
    queryFn: () =>
      listFCADocumentos({
        page,
        page_size: 25,
        cd_cvm: cdCvmNumber,
        cnpj: cnpj || undefined,
        year: year ? Number(year) : undefined,
      }),
  });

  const triggerSyncMutation = useMutation({
    mutationFn: () =>
      triggerFCASync({ year: Number(syncYear), force: forceSync }),
    onSuccess: (data) => {
      toast.success(`Sync FCA agendado (task_id ${data.task_id}).`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "fca"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const status = syncStatusQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Formulario Cadastral (FCA)</CardTitle>
              <CardDescription>
                Cadastro anual da companhia — dados gerais, DRI, valores mobiliarios listados e
                auditor independente.
              </CardDescription>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="rounded-full">
                  <RefreshCcw className="size-4" />
                  Sincronizar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disparar sync de FCA?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Envia <span className="font-mono">POST /admin/cvm/fca/sync</span> para o ano informado.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sync-year">Ano</Label>
                    <Select
                      id="sync-year"
                      value={syncYear}
                      onChange={(event) => setSyncYear(event.target.value)}
                    >
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <label className="flex items-center gap-3 self-end rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={forceSync}
                      onChange={(event) => setForceSync(event.target.checked)}
                    />
                    Forcar reprocessar
                  </label>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => triggerSyncMutation.mutate()}
                    disabled={triggerSyncMutation.isPending}
                  >
                    {triggerSyncMutation.isPending ? "Enfileirando..." : "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Documentos</CardDescription>
              <CardTitle>{status?.total_documentos ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Empresas distintas</CardDescription>
              <CardTitle>{status?.distinct_companies ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Anos disponiveis</CardDescription>
              <CardTitle>{status?.distinct_years ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Ultimo hash · {formatDateTime(status?.last_captured_at)}</CardDescription>
              <CardTitle className="font-mono text-base">
                {truncateHash(status?.last_file_hash, 8)}
              </CardTitle>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volume por secao</CardTitle>
          <CardDescription>
            Numero de linhas em cada secao do FCA via{" "}
            <span className="font-mono">/sync-status.rows_by_section</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && Object.keys(status.rows_by_section).length > 0 ? (
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-4">
              {Object.entries(status.rows_by_section)
                .sort(([, a], [, b]) => b - a)
                .map(([section, count]) => (
                  <div
                    key={section}
                    className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section}
                    </p>
                    <p className="mt-1.5 font-mono text-lg text-foreground">{count}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados de secoes carregados.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-cd-cvm">cd_cvm</Label>
            <Input
              id="filter-cd-cvm"
              inputMode="numeric"
              placeholder="9512"
              value={cdCvm}
              onChange={(event) => {
                setPage(1);
                setCdCvm(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-cnpj">CNPJ</Label>
            <Input
              id="filter-cnpj"
              placeholder="33000167000101"
              value={cnpj}
              onChange={(event) => {
                setPage(1);
                setCnpj(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-year">Ano</Label>
            <Select
              id="filter-year"
              value={year}
              onChange={(event) => {
                setPage(1);
                setYear(event.target.value);
              }}
            >
              <option value="">todos</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={documentosQuery.data?.items ?? []}
        loading={documentosQuery.isLoading}
        pagination={documentosQuery.data?.pagination}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum documento FCA encontrado para os filtros informados."
      />
    </div>
  );
}
