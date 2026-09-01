import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CompanyAssignmentEditor } from "./company-assignment-editor";
import type { SectorWithSubsectorsResponse } from "@/lib/services/admin/types";

const SETORES: SectorWithSubsectorsResponse[] = [
  {
    id: "s1",
    name: "Bancos",
    slug: "bancos",
    company_count: 2,
    created_at: "",
    subsectors: [
      {
        id: "sub1",
        sector_id: "s1",
        name: "Intermediários",
        slug: "inter",
        company_count: 2,
        created_at: "",
        updated_at: "",
      },
    ],
  },
  {
    id: "s2",
    name: "Materiais",
    slug: "materiais",
    company_count: 1,
    created_at: "",
    subsectors: [
      {
        id: "sub2",
        sector_id: "s2",
        name: "Papel",
        slug: "papel",
        company_count: 1,
        created_at: "",
        updated_at: "",
      },
    ],
  },
];

function montar(over: Partial<Parameters<typeof CompanyAssignmentEditor>[0]> = {}) {
  const onSubmit = vi.fn();
  render(
    <CompanyAssignmentEditor
      sectors={SETORES}
      initialSectorId="s1"
      initialSubsectorId="sub1"
      saving={false}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      {...over}
    />,
  );
  return { onSubmit };
}

describe("CompanyAssignmentEditor", () => {
  it("abre pré-preenchido com o setor e o subsetor atuais", () => {
    // O fluxo antigo abria em "Manter setor atual" e obrigava a lembrar onde a
    // empresa estava.
    montar();
    expect(screen.getByTestId("assignment-sector")).toHaveValue("s1");
    expect(screen.getByTestId("assignment-subsector")).toHaveValue("sub1");
  });

  it("Salvar fica desabilitado enquanto nada mudou", () => {
    // Some o `throw new Error("Escolha um novo setor ou subsetor")`, que era erro
    // de runtime para um estado que a UI podia impedir.
    montar();
    expect(screen.getByTestId("assignment-save")).toBeDisabled();
  });

  it("dá para mudar SÓ o subsetor — o select nunca fica desabilitado", async () => {
    const user = userEvent.setup();
    const { onSubmit } = montar();

    const sub = screen.getByTestId("assignment-subsector");
    expect(sub).not.toBeDisabled();
    await user.selectOptions(sub, "__none__");
    await user.click(screen.getByTestId("assignment-save"));

    // Chave presente se e só se mudou: só `subsector_id`, e com `null` explícito
    // (que é o que o backend distingue de "chave ausente").
    expect(onSubmit).toHaveBeenCalledWith({ subsector_id: null });
  });

  it("trocar o setor reseta o subsetor e manda as duas chaves", async () => {
    const user = userEvent.setup();
    const { onSubmit } = montar();

    await user.selectOptions(screen.getByTestId("assignment-sector"), "s2");
    // Deliberadamente não casa o subsetor por nome no setor novo: com 25
    // homônimos isso moveria a empresa para um subsetor errado em silêncio.
    expect(screen.getByTestId("assignment-subsector")).toHaveValue("__none__");

    await user.click(screen.getByTestId("assignment-save"));
    // O caso que exige atenção: mandar só `sector_id` deixaria a empresa
    // apontando para um subsetor do setor antigo — 422.
    expect(onSubmit).toHaveBeenCalledWith({ sector_id: "s2", subsector_id: null });
  });

  it("escolher subsetor do setor novo manda os dois ids", async () => {
    const user = userEvent.setup();
    const { onSubmit } = montar();

    await user.selectOptions(screen.getByTestId("assignment-sector"), "s2");
    await user.selectOptions(screen.getByTestId("assignment-subsector"), "sub2");
    await user.click(screen.getByTestId("assignment-save"));

    expect(onSubmit).toHaveBeenCalledWith({ sector_id: "s2", subsector_id: "sub2" });
  });

  it("empresa sem subsetor que ganha um manda só o subsetor", async () => {
    const user = userEvent.setup();
    const { onSubmit } = montar({ initialSubsectorId: null });

    expect(screen.getByTestId("assignment-subsector")).toHaveValue("__none__");
    await user.selectOptions(screen.getByTestId("assignment-subsector"), "sub1");
    await user.click(screen.getByTestId("assignment-save"));

    expect(onSubmit).toHaveBeenCalledWith({ subsector_id: "sub1" });
  });
});
