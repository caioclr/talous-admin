import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentTextViewer } from "./document-text-viewer";

const TEXTO =
  "RESULTADOS 2T26 Receita Liquida +1,6% a/a GMV R$ 10,5 Bi total (+0,5% a/a) " +
  "EBITDA Ajustado R$ 518 MM margem EBITDA 7,4% vs 8,3% no 2T25 GMV 1P Online";

describe("DocumentTextViewer", () => {
  it("mostra o texto inteiro sem termo de busca", () => {
    render(<DocumentTextViewer text={TEXTO} />);
    expect(screen.getByTestId("viewer-text").textContent).toBe(TEXTO);
  });

  it("busca com menos de 2 caracteres nao filtra nem conta", async () => {
    // Sem o piso, cada tecla reprocessaria ~44 mil caracteres e destacaria
    // praticamente tudo.
    const user = userEvent.setup();
    render(<DocumentTextViewer text={TEXTO} />);
    await user.type(screen.getByTestId("viewer-search"), "G");
    expect(screen.queryByTestId("viewer-matches")).not.toBeInTheDocument();
  });

  it("conta e destaca as ocorrencias", async () => {
    // O gargalo de quem cura nao e ler, e localizar: o release tem ~44 mil
    // caracteres em media.
    const user = userEvent.setup();
    render(<DocumentTextViewer text={TEXTO} />);
    await user.type(screen.getByTestId("viewer-search"), "GMV");
    expect(screen.getByTestId("viewer-matches")).toHaveTextContent("2 ocorrencia(s)");
    expect(screen.getByTestId("viewer-text").querySelectorAll("mark")).toHaveLength(2);
  });

  it("a busca ignora caixa", async () => {
    const user = userEvent.setup();
    render(<DocumentTextViewer text={TEXTO} />);
    await user.type(screen.getByTestId("viewer-search"), "ebitda");
    expect(screen.getByTestId("viewer-matches")).toHaveTextContent("2 ocorrencia(s)");
  });

  it("termo com parentese nao quebra a busca", async () => {
    // Conta por `split`, nao por regex: release escreve "(+0,5% a/a)".
    const user = userEvent.setup();
    render(<DocumentTextViewer text={TEXTO} />);
    await user.type(screen.getByTestId("viewer-search"), "(+0,5%");
    expect(screen.getByTestId("viewer-matches")).toHaveTextContent("1 ocorrencia(s)");
  });

  it("o texto destacado preserva o conteudo original", async () => {
    const user = userEvent.setup();
    render(<DocumentTextViewer text={TEXTO} />);
    await user.type(screen.getByTestId("viewer-search"), "GMV");
    // Destacar nao pode perder nem duplicar caractere.
    expect(screen.getByTestId("viewer-text").textContent).toBe(TEXTO);
  });

  it("copiar trecho fica desabilitado sem selecao", () => {
    render(<DocumentTextViewer text={TEXTO} onCopySelection={vi.fn()} />);
    expect(screen.getByTestId("viewer-copy-selection")).toBeDisabled();
  });

  it("sem callback, o botao de copiar nao existe", () => {
    render(<DocumentTextViewer text={TEXTO} />);
    expect(screen.queryByTestId("viewer-copy-selection")).not.toBeInTheDocument();
  });
});
