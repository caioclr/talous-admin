"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { getFCAByCompany } from "@/lib/services/admin/cvm-fca";
import type { FCADocumentoSummary } from "@/lib/services/admin/types";

const documentoColumns: DataTableColumn<FCADocumentoSummary>[] = [
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

export default function FCACompanyPage() {
  const searchParams = useSearchParams();
  const cdCvm = searchParams.get("cd_cvm") ?? "";

  const companyQuery = useQuery({
    queryKey: ["cvm", "fca", "by-company", cdCvm],
    queryFn: () => getFCAByCompany(cdCvm),
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
                Formulario Cadastral (FCA) · cd_cvm {cdCvm}
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
          <CardTitle>Historico de documentos</CardTitle>
          <CardDescription>
            Um formulario cadastral por exercicio — reapresentacoes geram novas versoes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={documentoColumns}
            data={company?.documentos ?? []}
            loading={companyQuery.isLoading}
            getRowKey={(row) => row.id}
            emptyMessage="Sem documentos FCA para a empresa."
          />
        </CardContent>
      </Card>
    </div>
  );
}
