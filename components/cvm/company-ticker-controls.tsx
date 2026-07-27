"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, RotateCcw } from "lucide-react";
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
import { formatDateTime } from "@/lib/formatters";
import { setTickerActive } from "@/lib/services/admin/cvm-registry";
import type { AdminTicker } from "@/lib/services/admin/types";

/**
 * Aceita tanto a forma atual do detalhe (`string[]` — so os simbolos) quanto a
 * forma enriquecida (`AdminTicker[]`, com is_active/delisted_at). Hoje o backend
 * devolve apenas os simbolos em `AdminCompanyDetail.tickers`; se/quando o
 * detalhe passar a expor estado por ticker, a UI reflete o estado inicial sem
 * mudanca aqui.
 */
type TickerInput = string | AdminTicker;

function normalize(tickers: TickerInput[], primaryTicker: string | null): AdminTicker[] {
  return tickers.map((t) =>
    typeof t === "string"
      ? {
          ticker: t,
          is_active: true,
          is_primary: t === primaryTicker,
          delisted_at: null,
        }
      : t,
  );
}

/**
 * Lista os tickers da empresa com estado (Ativo / Desabilitado) e o controle de
 * delisting manual: desabilitar (esconde do Rastreador do app) e reabilitar.
 * Chama PATCH /admin/cvm/companies/{cd_cvm}/tickers/{ticker}.
 */
export function CompanyTickerControls({
  cdCvm,
  tickers,
  primaryTicker,
}: {
  cdCvm: string;
  tickers: TickerInput[];
  primaryTicker: string | null;
}) {
  const base = useMemo(() => normalize(tickers, primaryTicker), [tickers, primaryTicker]);

  // Override local por ticker, definido SO pelo retorno do PATCH. Necessario
  // porque o detalhe nao materializa is_active/delisted_at por ticker (mesmo
  // padrao do ValidationActionPanel): sem isso a badge/botao nao refletiriam a
  // acao ate um refetch que ainda traz so os simbolos.
  const [overrides, setOverrides] = useState<Record<string, AdminTicker>>({});
  const rows = base.map((t) => overrides[t.ticker] ?? t);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum ticker cadastrado para esta empresa.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((ticker) => (
        <TickerRow
          key={ticker.ticker}
          cdCvm={cdCvm}
          ticker={ticker}
          onChange={(next) => setOverrides((prev) => ({ ...prev, [next.ticker]: next }))}
        />
      ))}
    </ul>
  );
}

function TickerRow({
  cdCvm,
  ticker,
  onChange,
}: {
  cdCvm: string;
  ticker: AdminTicker;
  onChange: (ticker: AdminTicker) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (isActive: boolean) => setTickerActive(cdCvm, ticker.ticker, isActive),
    onSuccess: (updated) => {
      toast.success(
        updated.is_active
          ? `Ticker ${updated.ticker} reabilitado.`
          : `Ticker ${updated.ticker} desabilitado (deslistado).`,
      );
      onChange(updated);
      // Mantem o detalhe da empresa coerente ao voltar para as outras abas.
      void queryClient.invalidateQueries({ queryKey: ["cvm", "company", cdCvm] });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const active = ticker.is_active;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">{ticker.ticker}</span>
          {ticker.is_primary ? <Badge variant="secondary">Primario</Badge> : null}
          <Badge variant={active ? "success" : "warning"}>
            {active ? "Ativo" : "Desabilitado"}
          </Badge>
        </div>
        {!active && ticker.delisted_at ? (
          <p className="text-xs text-muted-foreground">
            Desabilitado em {formatDateTime(ticker.delisted_at)}
          </p>
        ) : null}
      </div>

      {active ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={mutation.isPending}>
              <Ban className="size-4" />
              Desabilitar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desabilitar {ticker.ticker}?</AlertDialogTitle>
              <AlertDialogDescription>
                O ticker sera marcado como deslistado (<span className="font-mono">is_active=false</span>)
                e escondido do Rastreador do app. A acao e reversivel — voce pode reabilitar depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => mutation.mutate(false)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Desabilitando..." : "Desabilitar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutation.mutate(true)}
          disabled={mutation.isPending}
        >
          <RotateCcw className="size-4" />
          {mutation.isPending ? "Reabilitando..." : "Reabilitar"}
        </Button>
      )}
    </li>
  );
}
