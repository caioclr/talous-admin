"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { getICBGCByCompany } from "@/lib/services/admin/cvm-icbgc";
import type { GovernanceReportSummary } from "@/lib/services/admin/types";

const reportColumns: DataTableColumn<GovernanceReportSummary>[] = [
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
    key: "reapresentacao",
    header: "Reapresentacao",
    render: (row) =>
      row.motivo_reapresentacao ? (
        <p className="line-clamp-2 text-xs" title={row.motivo_reapresentacao}>
          {row.motivo_reapresentacao}
        </p>
      ) : (
        "—"
      ),
  },
  {
    key: "entrega",
    header: "Entregue em",
    render: (row) => formatDate(row.data_entrega),
  },
  {
    key: "captured",
    header: "Capturado",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "detail",
    header: "Informe",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/icbgc/reports/detail?id_documento=${row.id_documento}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function ICBGCCompanyPage() {
  const searchParams = useSearchParams();
  const cdCvm = searchParams.get("cd_cvm") ?? "";

  const companyQuery = useQuery({
    queryKey: ["cvm", "icbgc", "by-company", cdCvm],
    queryFn: () => getICBGCByCompany(cdCvm),
  });

  const company = companyQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{company?.company_name ?? `Empresa ${cdCvm}`}</CardTitle>
              <CardDescription className="mt-1">
                Governanca ICBGC · cd_cvm {cdCvm}
              </CardDescription>
            </div>

            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${cdCvm}`}
            >
              Ir para cadastro da empresa
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de informes</CardTitle>
          <CardDescription>
            Um informe por exercicio social — reapresentacoes geram novas versoes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={reportColumns}
            data={company?.reports ?? []}
            loading={companyQuery.isLoading}
            getRowKey={(row) => row.id}
            emptyMessage="Sem informes ICBGC para a empresa."
          />
        </CardContent>
      </Card>
    </div>
  );
}
