"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listIPEByCompany } from "@/lib/services/admin/cvm-ipe";
import { formatDate, formatDateTime } from "@/lib/formatters";
import type { IPEDisclosureSummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<IPEDisclosureSummary>[] = [
  {
    key: "assunto",
    header: "Assunto",
    render: (row) => (
      <div className="space-y-1">
        <p className="line-clamp-2 font-medium text-foreground">{row.assunto}</p>
        <p className="text-xs text-muted-foreground">{row.protocolo_entrega}</p>
      </div>
    ),
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) => row.categoria,
  },
  {
    key: "signal",
    header: "Sinal",
    render: (row) => row.signal_classification ?? "—",
  },
  {
    key: "entrega",
    header: "Entrega",
    render: (row) => formatDate(row.data_entrega),
  },
  {
    key: "notified",
    header: "Notificado",
    render: (row) => (row.notification_dispatched ? "Sim" : "Nao"),
  },
  {
    key: "detail",
    header: "Detalhe",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/ipe/disclosures/detail?id=${row.id}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function IPECompanyHistoryPage() {
  const searchParams = useSearchParams();
  const cdCvm = searchParams.get("cd_cvm") ?? "";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoria, setCategoria] = useState("");

  const historyQuery = useQuery({
    queryKey: ["cvm", "ipe", "company", cdCvm, { page, pageSize, categoria }],
    queryFn: () =>
      listIPEByCompany(cdCvm, {
        page,
        page_size: pageSize,
        categoria: categoria || undefined,
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Historico IPE da empresa {cdCvm}</CardTitle>
          <CardDescription>
            Lista paginada de disclosures retornada por `GET /admin/cvm/ipe/disclosures/by-company/{`{cd_cvm}`}`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="ipe-company-category">
              Filtrar por categoria
            </label>
            <Input
              id="ipe-company-category"
              placeholder="Categoria"
              value={categoria}
              onChange={(event) => {
                setPage(1);
                setCategoria(event.target.value);
              }}
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
            Atualizado em {formatDateTime(historyQuery.data?.items[0]?.data_entrega ?? null)}
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={historyQuery.data?.items ?? []}
        loading={historyQuery.isLoading}
        pagination={historyQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum disclosure IPE encontrado para esta empresa."
      />
    </div>
  );
}
