"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  ValidationBadge,
  ValidationStatusFilter,
  asValidationStatus,
} from "@/components/validation";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { listIntermediarios } from "@/lib/services/admin/cvm-participantes";
import type { IntermediarioRegistrySummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<IntermediarioRegistrySummary>[] = [
  {
    key: "intermediario",
    header: "Intermediario",
    render: (row) => (
      <Link
        className="space-y-1 underline-offset-4 hover:underline"
        href={`/cvm/participantes/intermediarios/detail?cnpj=${row.cnpj}`}
      >
        <p className="font-medium text-foreground">{row.denom_social}</p>
        <p className="text-xs text-muted-foreground">
          CNPJ {row.cnpj}
          {row.denom_comerc ? ` · ${row.denom_comerc}` : ""}
        </p>
      </Link>
    ),
  },
  {
    key: "tipo_participante",
    header: "Tipo de participante",
    render: (row) => <Badge variant="secondary">{row.tipo_participante}</Badge>,
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
        href={`/cvm/participantes/intermediarios/validate?id=${encodeURIComponent(row.id)}&situacao=${encodeURIComponent(row.situacao)}&tipo_participante=${encodeURIComponent(row.tipo_participante)}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function ParticipantesIntermediariosPage() {
  const [page, setPage] = useState(1);
  const [situacao, setSituacao] = useState("");
  const [tipoParticipante, setTipoParticipante] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const intermediariosQuery = useQuery({
    queryKey: [
      "cvm",
      "participantes",
      "intermediarios",
      { page, situacao, tipoParticipante, validationStatus },
    ],
    queryFn: () =>
      listIntermediarios({
        page,
        page_size: 25,
        situacao: situacao || undefined,
        tipo_participante: tipoParticipante || undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Intermediarios</CardTitle>
              <CardDescription>
                Cadastro CVM de intermediarios — corretoras, distribuidoras e bancos autorizados a
                operar nos mercados de valores mobiliarios.
              </CardDescription>
            </div>

            <ParticipantesSyncDialog defaultDataset="intermed" />
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
              placeholder="EM FUNCIONAMENTO NORMAL"
              value={situacao}
              onChange={(event) => {
                setPage(1);
                setSituacao(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-tipo-participante">Tipo de participante</Label>
            <Input
              id="filter-tipo-participante"
              placeholder="CORRETORA"
              value={tipoParticipante}
              onChange={(event) => {
                setPage(1);
                setTipoParticipante(event.target.value);
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
        data={intermediariosQuery.data?.items ?? []}
        loading={intermediariosQuery.isLoading}
        pagination={intermediariosQuery.data?.pagination}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum intermediario encontrado para os filtros informados."
      />
    </div>
  );
}
