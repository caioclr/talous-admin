"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { triggerParticipantesSync } from "@/lib/services/admin/cvm-participantes";
import type { ParticipantesSyncDataset } from "@/lib/services/admin/types";

const DATASET_OPTIONS: Array<{ value: ParticipantesSyncDataset; label: string }> = [
  { value: "auditor", label: "Auditores" },
  { value: "intermed", label: "Intermediarios" },
  { value: "adm_cart", label: "Adm. de carteira" },
  { value: "all", label: "Todos" },
];

/**
 * AlertDialog de sync dos cadastros de participantes — compartilhado pelas
 * tres listas (auditores, intermediarios, adm. carteira); cada pagina abre o
 * dialogo com o proprio dataset pre-selecionado.
 */
export function ParticipantesSyncDialog({
  defaultDataset = "all",
}: {
  defaultDataset?: ParticipantesSyncDataset;
}) {
  const queryClient = useQueryClient();
  const [dataset, setDataset] = useState<ParticipantesSyncDataset>(defaultDataset);
  const [force, setForce] = useState(false);

  const triggerSyncMutation = useMutation({
    mutationFn: () => triggerParticipantesSync({ dataset, force }),
    onSuccess: (data) => {
      toast.success(`Sync de participantes agendado (task_id ${data.task_id}).`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "participantes"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="rounded-full">
          <RefreshCcw className="size-4" />
          Sincronizar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disparar sync de participantes?</AlertDialogTitle>
          <AlertDialogDescription>
            Envia <span className="font-mono">POST /admin/cvm/participantes/sync</span> para o
            dataset selecionado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="sync-dataset">Dataset</Label>
            <Select
              id="sync-dataset"
              value={dataset}
              onChange={(event) =>
                setDataset(event.target.value as ParticipantesSyncDataset)
              }
            >
              {DATASET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <label className="flex items-center gap-3 self-end rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={force}
              onChange={(event) => setForce(event.target.checked)}
            />
            Forcar reprocessar
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => triggerSyncMutation.mutate()}
            disabled={triggerSyncMutation.isPending}
          >
            {triggerSyncMutation.isPending ? "Enfileirando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
