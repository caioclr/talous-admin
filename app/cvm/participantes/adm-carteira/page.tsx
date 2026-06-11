"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import {
  ParticipantesSyncCards,
  situacaoBadgeVariant,
} from "@/components/participantes-sync-cards";
import { ParticipantesSyncDialog } from "@/components/participantes-sync-dialog";
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
];

export default function ParticipantesAdmCarteiraPage() {
  const [page, setPage] = useState(1);
  const [situacao, setSituacao] = useState("");
  const [categoriaRegistro, setCategoriaRegistro] = useState("");

  const admCarteiraQuery = useQuery({
    queryKey: [
      "cvm",
      "participantes",
      "adm-carteira",
      { page, situacao, categoriaRegistro },
    ],
    queryFn: () =>
      listAdmCarteira({
        page,
        page_size: 25,
        situacao: situacao || undefined,
        categoria_registro: categoriaRegistro || undefined,
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
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={admCarteiraQuery.data?.items ?? []}
        loading={admCarteiraQuery.isLoading}
        pagination={admCarteiraQuery.data?.pagination}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum administrador de carteira encontrado para os filtros informados."
      />
    </div>
  );
}
