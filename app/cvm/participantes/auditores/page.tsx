"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/pagination";
import {
  ParticipantesSyncCards,
  situacaoBadgeVariant,
} from "@/components/participantes-sync-cards";
import { ParticipantesSyncDialog } from "@/components/participantes-sync-dialog";
import {
  ValidationBadge,
  ValidationStatusFilter,
  asValidationStatus,
} from "@/components/validation";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { listAuditores } from "@/lib/services/admin/cvm-participantes";
import type { AuditorRegistrySummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<AuditorRegistrySummary>[] = [
  {
    key: "auditor",
    header: "Auditor",
    render: (row) => (
      <Link
        className="space-y-1 underline-offset-4 hover:underline"
        href={`/cvm/participantes/auditores/detail?cd_cvm=${row.cd_cvm}&tipo=${row.tipo}`}
      >
        <p className="font-medium text-foreground">{row.nome}</p>
        <p className="text-xs text-muted-foreground">
          cd_cvm {row.cd_cvm} · CNPJ {row.cnpj ?? "—"}
        </p>
      </Link>
    ),
  },
  {
    key: "tipo",
    header: "Tipo",
    render: (row) => <Badge variant="secondary">{row.tipo}</Badge>,
  },
  {
    key: "situacao",
    header: "Situacao",
    render: (row) => <Badge variant={situacaoBadgeVariant(row.situacao)}>{row.situacao}</Badge>,
  },
  {
    key: "dt_ini_sit",
    header: "Inicio da situacao",
    render: (row) => formatDate(row.dt_ini_sit),
  },
  {
    key: "local",
    header: "Local",
    render: (row) =>
      row.municipio || row.uf
        ? [row.municipio, row.uf].filter(Boolean).join(" / ")
        : "—",
  },
  {
    key: "captured",
    header: "Capturado",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "status",
    header: "Status",
    // Backend pode nao materializar `validation` na lista — ausencia = pendente.
    render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
  },
  {
    key: "validate",
    header: "Validacao",
    // `situacao`/`tipo` da propria linha garantem que o registro esteja na lista
    // estreitada lida pela tela de validacao (sem endpoint de detalhe por id).
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/participantes/auditores/validate?id=${encodeURIComponent(row.id)}&situacao=${encodeURIComponent(row.situacao)}&tipo=${encodeURIComponent(row.tipo)}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function ParticipantesAuditoresPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [situacao, setSituacao] = useState("");
  const [tipo, setTipo] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const auditoresQuery = useQuery({
    queryKey: ["cvm", "participantes", "auditores", { page, pageSize, situacao, tipo, validationStatus }],
    queryFn: () =>
      listAuditores({
        page,
        page_size: pageSize,
        situacao: situacao || undefined,
        tipo: tipo ? (tipo as "PJ" | "PF") : undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Auditores independentes</CardTitle>
              <CardDescription>
                Cadastro CVM de auditores independentes — pessoas juridicas e fisicas autorizadas a
                auditar companhias abertas.
              </CardDescription>
            </div>

            <ParticipantesSyncDialog defaultDataset="auditor" />
          </div>
        </CardHeader>

        <CardContent>
          <ParticipantesSyncCards />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-situacao">Situacao</Label>
            <Input
              id="filter-situacao"
              placeholder="ATIVO"
              value={situacao}
              onChange={(event) => {
                setPage(1);
                setSituacao(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-tipo">Tipo</Label>
            <Select
              id="filter-tipo"
              value={tipo}
              onChange={(event) => {
                setPage(1);
                setTipo(event.target.value);
              }}
            >
              <option value="">todos</option>
              <option value="PJ">PJ</option>
              <option value="PF">PF</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-validation-status">Status de validacao</Label>
            <ValidationStatusFilter
              id="filter-validation-status"
              value={validationStatus}
              onChange={(value) => {
                setPage(1);
                setValidationStatus(value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={auditoresQuery.data?.items ?? []}
        loading={auditoresQuery.isLoading}
        pagination={auditoresQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum auditor encontrado para os filtros informados."
      />
    </div>
  );
}
