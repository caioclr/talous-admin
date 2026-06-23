import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CvmAcronym } from "@/components/cvm-acronym";
import { getCvmAcronym } from "@/lib/cvm-glossary";

describe("getCvmAcronym", () => {
  it("resolves a known acronym", () => {
    expect(getCvmAcronym("IPE")?.termo).toBe("Informacoes Periodicas e Eventuais");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getCvmAcronym("  ipe  ")?.termo).toBe(
      "Informacoes Periodicas e Eventuais",
    );
  });

  it("resolves technical identifiers like cd_cvm", () => {
    expect(getCvmAcronym("cd_cvm")?.termo).toBe("Codigo CVM");
  });

  it("returns undefined for unknown acronyms", () => {
    expect(getCvmAcronym("XYZ")).toBeUndefined();
    expect(getCvmAcronym("")).toBeUndefined();
  });
});

describe("CvmAcronym", () => {
  it("renders the acronym text verbatim for known entries (no aria-label pollution)", () => {
    render(<CvmAcronym sigla="VLMO" />);

    const trigger = screen.getByText("VLMO");
    expect(trigger).toBeInTheDocument();
    // The trigger must NOT carry an aria-label: doing so would override the
    // accessible name of any heading/link wrapping it. Radix wires the
    // description via aria-describedby instead.
    expect(trigger).not.toHaveAttribute("aria-label");
  });

  it("renders custom children while keeping the glossary lookup by sigla", () => {
    render(
      <CvmAcronym sigla="cd_cvm">
        <span>codigo</span>
      </CvmAcronym>,
    );

    expect(screen.getByText("codigo")).toBeInTheDocument();
  });

  it("degrades to plain text (no tooltip) for unknown siglas", () => {
    render(<CvmAcronym sigla="DESCONHECIDA" />);

    const text = screen.getByText("DESCONHECIDA");
    expect(text).toBeInTheDocument();
    expect(text).not.toHaveAttribute("aria-label");
  });

  it("is keyboard-focusable by default but not when interactive=false", () => {
    const { rerender } = render(<CvmAcronym sigla="FRE" />);
    expect(screen.getByText("FRE")).toHaveAttribute("tabindex", "0");

    rerender(<CvmAcronym sigla="FRE" interactive={false} />);
    expect(screen.getByText("FRE")).not.toHaveAttribute("tabindex");
  });
});
