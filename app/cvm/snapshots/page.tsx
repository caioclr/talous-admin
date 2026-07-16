"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/pagination";
import {
  ValidationBadge,
  ValidationStatusFilter,
  asValidationStatus,
} from "@/components/validation";
import { formatDateTime, truncateHash } from "@/lib/formatters";
import { listSnapshots } from "@/lib/services/admin/cvm-registry";
import type { CVMSnapshotSummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<CVMSnapshotSummary>[] = [
  {
    key: "captured_at",
    header: "Capturado em",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "company",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.denom_social}</p>
        <p className="text-xs text-muted-foreground">cd_cvm {row.cd_cvm}</p>
      </div>
    ),
  },
  {
    key: "situacao",
    header: "Situacao",
    render: (row) => row.situacao,
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) => row.categoria_registro,
  },
  {
    key: "mercado",
    header: "Mercado",
    render: (row) => row.tipo_mercado,
  },
  {
    key: "hash",
    header: "Hash",
    render: (row) => (
      <span className="font-mono text-xs text-muted-foreground">
        {truncateHash(row.file_version_hash, 8)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    // O backend pode ainda nao materializar `validation` na lista — tratamos
    // ausencia como pendente para nao quebrar a tela.
    render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
  },
  {
    key: "validate",
    header: "Validacao",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/snapshots/validate?id=${encodeURIComponent(row.id)}`}
        onClick={(event) => event.stopPropagation()}
      >
        Abrir
      </Link>
    ),
  },
];

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export default function SnapshotsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [cdCvm, setCdCvm] = useState("");
  const [capturedAtFrom, setCapturedAtFrom] = useState("");
  const [capturedAtTo, setCapturedAtTo] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const snapshotsQuery = useQuery({
    queryKey: [
      "cvm",
      "snapshots",
      { page, pageSize, cdCvm, capturedAtFrom, capturedAtTo, validationStatus },
    ],
    queryFn: () =>
      listSnapshots({
        page,
        page_size: pageSize,
        cd_cvm: cdCvm ? Number(cdCvm) : undefined,
        captured_at_from: toIsoDateTime(capturedAtFrom),
        captured_at_to: toIsoDateTime(capturedAtTo),
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Snapshots do cadastro CVM</CardTitle>
          <CardDescription>
            Filtro por `cd_cvm`, janela temporal de captura e status de validacao.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            value={cdCvm}
            type="number"
            placeholder="cd_cvm"
            onChange={(event) => {
              setPage(1);
              setCdCvm(event.target.value);
            }}
          />
          <Input
            value={capturedAtFrom}
            type="datetime-local"
            onChange={(event) => {
              setPage(1);
              setCapturedAtFrom(event.target.value);
            }}
          />
          <Input
            value={capturedAtTo}
            type="datetime-local"
            onChange={(event) => {
              setPage(1);
              setCapturedAtTo(event.target.value);
            }}
          />
          <ValidationStatusFilter
            id="filter-validation-status"
            value={validationStatus}
            onChange={(value) => {
              setPage(1);
              setValidationStatus(value);
            }}
          />
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={snapshotsQuery.data?.items ?? []}
        loading={snapshotsQuery.isLoading}
        pagination={snapshotsQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        onRowClick={(row) =>
          router.push(`/cvm/snapshots/validate?id=${encodeURIComponent(row.id)}`)
        }
        emptyMessage="Nenhum snapshot encontrado."
      />
    </div>
  );
}
