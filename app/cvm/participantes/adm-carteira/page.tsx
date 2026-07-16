"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { listAdmCarteira } from "@/lib/services/admin/cvm-participantes";
import type { AdmCarteiraRegistrySummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<AdmCarteiraRegistrySummary>[] = [
  {
    key: "administrador",
    header: "Administrador",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.denom_social}</p>
        <p className="text-xs text-muted-foreground">
          CNPJ {row.cnpj}
          {row.denom_comerc ? ` · ${row.denom_comerc}` : ""}
        </p>
      </div>
    ),
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) => (
      <div className="space-y-1">
        <Badge variant="secondary">{row.categoria_registro}</Badge>
        {row.subcategoria_registro ? (
          <p className="text-xs text-muted-foreground">{row.subcategoria_registro}</p>
        ) : null}
      </div>
    ),
  },
  {
    key: "situacao",
    header: "Situacao",
    render: (row) => <Badge variant={situacaoBadgeVariant(row.situacao)}>{row.situacao}</Badge>,
  },
  {
    key: "registro",
    header: "Registrado em",
    render: (row) => formatDate(row.dt_reg),
  },
  {
    key: "cancelamento",
    header: "Cancelado em",
    render: (row) => formatDate(row.dt_cancel),
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
    render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
  },
  {
    key: "validate",
    header: "Validacao",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/participantes/adm-carteira/validate?id=${encodeURIComponent(row.id)}&situacao=${encodeURIComponent(row.situacao)}&categoria_registro=${encodeURIComponent(row.categoria_registro)}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function ParticipantesAdmCarteiraPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [situacao, setSituacao] = useState("");
  const [categoriaRegistro, setCategoriaRegistro] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const admCarteiraQuery = useQuery({
    queryKey: [
      "cvm",
      "participantes",
      "adm-carteira",
      { page, pageSize, situacao, categoriaRegistro, validationStatus },
    ],
    queryFn: () =>
      listAdmCarteira({
        page,
        page_size: pageSize,
        situacao: situacao || undefined,
        categoria_registro: categoriaRegistro || undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Administradores de carteira</CardTitle>
              <CardDescription>
                Cadastro CVM de administradores de carteira de valores mobiliarios — gestores e
                administradores fiduciarios.
              </CardDescription>
            </div>

            <ParticipantesSyncDialog defaultDataset="adm_cart" />
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
            <Label htmlFor="filter-categoria-registro">Categoria de registro</Label>
            <Input
              id="filter-categoria-registro"
              placeholder="Pessoa Juridica"
              value={categoriaRegistro}
              onChange={(event) => {
                setPage(1);
                setCategoriaRegistro(event.target.value);
              }}
            />
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
        data={admCarteiraQuery.data?.items ?? []}
        loading={admCarteiraQuery.isLoading}
        pagination={admCarteiraQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum administrador de carteira encontrado para os filtros informados."
      />
    </div>
  );
}
