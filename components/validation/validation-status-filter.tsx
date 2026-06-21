import { Select } from "@/components/ui/select";
import type { ValidationStatus } from "@/lib/services/admin/types";

interface ValidationStatusFilterProps {
  /** Valor atual ("" = todos). */
  value: string;
  onChange: (value: string) => void;
  /** Rotulo para acessibilidade (aria-label). */
  label?: string;
  id?: string;
}

/**
 * Filtro de amostragem pendente/validado — reutilizavel por qualquer tipo.
 * O valor "" significa "todos os status"; pending/valid mapeiam direto no
 * `validation_status` enviado ao backend.
 */
export function ValidationStatusFilter({
  value,
  onChange,
  label = "Status de validacao",
  id,
}: ValidationStatusFilterProps) {
  return (
    <Select
      id={id}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Todos status</option>
      <option value="pending">Pendente</option>
      <option value="valid">Validado</option>
    </Select>
  );
}

export function asValidationStatus(value: string): ValidationStatus | undefined {
  return (value || undefined) as ValidationStatus | undefined;
}
