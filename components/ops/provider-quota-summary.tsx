import { CheckCircle2, CircleAlert, CircleHelp, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  QUOTA_DANGER_RATIO,
  QUOTA_WARNING_RATIO,
  formatQuotaDay,
  parseProviderQuotaCheckedAt,
  quotaLevel,
  quotaRatio,
  quotaRemaining,
  type ProviderQuotaSeries,
  type QuotaLevel,
} from "@/lib/services/admin/ops-provider-quota";

const integerFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
/** A cota e o `day` sao do fuso de Sao Paulo; a hora da leitura segue o mesmo fuso. */
const checkedAtFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatQuotaInteger(value: number | null) {
  return value === null ? "—" : integerFormat.format(value);
}

export function formatQuotaPercent(ratio: number | null) {
  return ratio === null ? "—" : percentFormat.format(ratio);
}

export function formatQuotaCheckedAt(value: string) {
  const parsed = parseProviderQuotaCheckedAt(value);
  return Number.isNaN(parsed.getTime()) ? "—" : checkedAtFormat.format(parsed);
}

/** Cor da barra/numero por faixa — tokens de status do tema. */
export const QUOTA_LEVEL_TEXT: Record<QuotaLevel, string> = {
  ok: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  unknown: "text-foreground",
};

export const QUOTA_LEVEL_BAR: Record<QuotaLevel, string> = {
  ok: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  unknown: "bg-muted-foreground",
};

export function QuotaLevelBadge({ level }: { level: QuotaLevel }) {
  if (level === "danger") {
    return (
      <Badge variant="destructive" className="gap-1">
        <OctagonAlert className="size-3" />
        Crítico
      </Badge>
    );
  }
  if (level === "warning") {
    return (
      <Badge variant="warning" className="gap-1">
        <CircleAlert className="size-3" />
        Atenção
      </Badge>
    );
  }
  if (level === "unknown") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleHelp className="size-3" />
        Sem limite
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="size-3" />
      OK
    </Badge>
  );
}

/** Barra horizontal de consumo (0–100%, cortada no limite). */
export function QuotaBar({
  ratio,
  level,
  className,
  label,
}: {
  ratio: number | null;
  level: QuotaLevel;
  className?: string;
  label: string;
}) {
  const width = ratio === null ? 0 : Math.min(Math.max(ratio, 0), 1) * 100;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className={cn("h-full rounded-full", QUOTA_LEVEL_BAR[level])} style={{ width: `${width}%` }} />
    </div>
  );
}

/**
 * Cabecalho de uma serie: consumo da leitura mais recente contra o limite
 * diario. Se a ultima linha nao for de hoje (job parado ou ainda sem leitura no
 * dia), diz isso em vez de apresentar o dia anterior como "hoje".
 */
export function ProviderQuotaSummary({
  series,
  today,
}: {
  series: ProviderQuotaSeries;
  /** `YYYY-MM-DD` de hoje em Sao Paulo. */
  today: string;
}) {
  const { latest } = series;
  const ratio = quotaRatio(latest.used, latest.daily_limit);
  const level = quotaLevel(ratio);
  const remaining = quotaRemaining(latest.used, latest.daily_limit);
  const isToday = latest.day === today;
  const exceededBy = remaining !== null && remaining < 0 ? -remaining : null;

  return (
    <Card className="metric-tile">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm">
            {isToday ? "Consumo hoje" : `Consumo em ${formatQuotaDay(latest.day)}`}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">{series.provider}</span>
            {latest.tier ? <Badge variant="secondary">plano {latest.tier}</Badge> : null}
          </div>
        </div>
        <QuotaLevelBadge level={level} />
      </CardHeader>
      <CardContent className="space-y-4">
        {isToday ? null : (
          <p className="rounded-md border border-warning/20 bg-warning-dim px-3 py-2 text-[11px] text-warning">
            Sem leitura hoje ({formatQuotaDay(today)}). A mais recente é de{" "}
            {formatQuotaDay(latest.day)} — confira o job <span className="font-mono">jobs.record_provider_quota</span>{" "}
            em Jobs / Sync.
          </p>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            data-testid="quota-used"
            className={cn("font-mono text-3xl font-semibold tabular-nums", QUOTA_LEVEL_TEXT[level])}
          >
            {formatQuotaInteger(latest.used)}
          </span>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            / {formatQuotaInteger(latest.daily_limit)} requisições
          </span>
        </div>

        <QuotaBar ratio={ratio} level={level} label="Consumo da cota diária" className="h-2.5" />

        <dl className="grid gap-3 text-[11px] sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Do limite diário</dt>
            <dd className={cn("font-mono text-base tabular-nums", QUOTA_LEVEL_TEXT[level])}>
              {formatQuotaPercent(ratio)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Restante</dt>
            <dd className="font-mono text-base tabular-nums text-foreground">
              {exceededBy !== null ? (
                <span className="text-destructive">Excedido em {formatQuotaInteger(exceededBy)}</span>
              ) : (
                formatQuotaInteger(remaining)
              )}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Última leitura</dt>
            <dd
              className="font-mono text-base tabular-nums text-foreground"
              title={`${latest.checked_at} UTC`}
            >
              {formatQuotaCheckedAt(latest.checked_at)}
            </dd>
          </div>
        </dl>

        <p className="text-[11px] text-muted-foreground">
          Atenção a partir de {Math.round(QUOTA_WARNING_RATIO * 100)}% do limite; crítico a partir de{" "}
          {Math.round(QUOTA_DANGER_RATIO * 100)}%.
          {isToday ? " A leitura é horária, então o consumo de hoje ainda é parcial." : null}
        </p>
      </CardContent>
    </Card>
  );
}
