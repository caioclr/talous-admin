"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatDateTime } from "@/lib/formatters";
import { listAdminCompanies } from "@/lib/services/admin/cvm-registry";
import type { AdminCompanySummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<AdminCompanySummary>[] = [
  {
    key: "company",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.cnpj ?? "Sem CNPJ"}</p>
      </div>
    ),
  },
  {
    key: "ticker",
    header: "Ticker",
    render: (row) => <Badge>{row.primary_ticker ?? "—"}</Badge>,
  },
  {
    key: "sector",
    header: "Setor",
    render: (row) => row.sector_slug ?? "—",
  },
  {
    key: "status",
    header: "Situacao",
    render: (row) => (
      <div className="space-y-1">
        <p>{row.cvm_situation ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.cvm_category ?? "Sem categoria"}</p>
      </div>
    ),
  },
  {
    key: "market",
    header: "Mercado",
    render: (row) => row.cvm_market_type ?? "—",
  },
  {
    key: "active",
    header: "Ativa",
    render: (row) => (
      <Badge variant={row.is_active ? "success" : "warning"}>
        {row.is_active ? "Sim" : "Nao"}
      </Badge>
    ),
  },
  {
    key: "sync",
    header: "Ultimo sync",
    render: (row) => formatDateTime(row.cvm_last_synced_at),
  },
];

export default function CompaniesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState("");
  const [category, setCategory] = useState("");
  const [marketType, setMarketType] = useState("");
  const [sectorSlug, setSectorSlug] = useState("");
  const [active, setActive] = useState("");
  // Default ON: o admin opera so com empresas da B3. Enviado explicitamente
  // porque o backend tem default false.
  const [b3Only, setB3Only] = useState(true);
  const deferredSearch = useDeferredValue(search);

  const companiesQuery = useQuery({
    queryKey: [
      "cvm",
      "companies",
      { page, deferredSearch, situation, category, marketType, sectorSlug, active, b3Only },
    ],
    queryFn: () =>
      listAdminCompanies({
        page,
        page_size: 20,
        search: deferredSearch || undefined,
        situation: situation || undefined,
        category: category || undefined,
        market_type: marketType || undefined,
        sector_slug: sectorSlug || undefined,
        is_active:
          active === "" ? undefined : active === "true",
        b3_only: b3Only,
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Empresas CVM</CardTitle>
          <CardDescription>
            Listagem paginada com filtros do endpoint `GET /admin/cvm/companies`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              className="pl-10"
              placeholder="Buscar por nome, CNPJ ou ticker"
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
          </div>

          <Select
            value={situation}
            onChange={(event) => {
              setPage(1);
              setSituation(event.target.value);
            }}
          >
            <option value="">Situacao</option>
            <option value="ATIVO">ATIVO</option>
            <option value="CANCELADO">CANCELADO</option>
            <option value="SUSPENSO">SUSPENSO</option>
          </Select>

          <Select
            value={category}
            onChange={(event) => {
              setPage(1);
              setCategory(event.target.value);
            }}
          >
            <option value="">Categoria</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </Select>

          <Input
            value={marketType}
            placeholder="Tipo de mercado"
            onChange={(event) => {
              setPage(1);
              setMarketType(event.target.value);
            }}
          />

          <Input
            value={sectorSlug}
            placeholder="Sector slug"
            onChange={(event) => {
              setPage(1);
              setSectorSlug(event.target.value);
            }}
          />

          <Select
            value={active}
            onChange={(event) => {
              setPage(1);
              setActive(event.target.value);
            }}
          >
            <option value="">Ativa?</option>
            <option value="true">Sim</option>
            <option value="false">Nao</option>
          </Select>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={b3Only}
              onChange={(event) => {
                setPage(1);
                setB3Only(event.target.checked);
              }}
            />
            Somente B3
          </label>
        </CardContent>
      </Card>

      {companiesQuery.isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar as empresas. {companiesQuery.error?.message}
          </CardContent>
        </Card>
      ) : null}

      {companiesQuery.isError ? null : (
        <DataTable
          columns={columns}
          data={companiesQuery.data?.items ?? []}
          loading={companiesQuery.isLoading}
          pagination={companiesQuery.data?.pagination}
          onPageChange={setPage}
          getRowKey={(row) => row.id}
          onRowClick={(row) => {
            if (row.cd_cvm) {
              router.push(`/cvm/companies/detail?cd_cvm=${row.cd_cvm}`);
            }
          }}
          emptyMessage="Nenhuma empresa encontrada para os filtros informados."
        />
      )}
    </div>
  );
}
