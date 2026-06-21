import { describe, expect, it } from "vitest";
import { formatFilingPeriodLabel, priorYearReferenceDate } from "@/lib/formatters";

describe("formatFilingPeriodLabel", () => {
  it("maps ITR months to quarters", () => {
    expect(formatFilingPeriodLabel("itr", "2025-03-31")).toBe("ITR Q1/2025");
    expect(formatFilingPeriodLabel("itr", "2025-06-30")).toBe("ITR Q2/2025");
    expect(formatFilingPeriodLabel("itr", "2025-09-30")).toBe("ITR Q3/2025");
    expect(formatFilingPeriodLabel("itr", "2025-12-31")).toBe("ITR Q4/2025");
  });

  it("labels DFP by year only", () => {
    expect(formatFilingPeriodLabel("dfp", "2025-12-31")).toBe("DFP 2025");
    expect(formatFilingPeriodLabel("DFP", "2024-12-31")).toBe("DFP 2024");
  });

  it("does not fabricate a quarter for an unmapped month", () => {
    expect(formatFilingPeriodLabel("itr", "2025-01-31")).toBe("ITR M01/2025");
  });

  it("falls back to the doc type when the date is missing or malformed", () => {
    expect(formatFilingPeriodLabel("itr", null)).toBe("ITR");
    expect(formatFilingPeriodLabel("dfp", "not-a-date")).toBe("DFP");
    expect(formatFilingPeriodLabel(null, null)).toBe("—");
  });
});

describe("priorYearReferenceDate", () => {
  it("subtracts exactly one year, keeping month/day", () => {
    expect(priorYearReferenceDate("2025-03-31")).toBe("2024-03-31");
    expect(priorYearReferenceDate("2025-12-31")).toBe("2024-12-31");
  });

  it("returns null for missing or malformed input", () => {
    expect(priorYearReferenceDate(null)).toBeNull();
    expect(priorYearReferenceDate("2025")).toBeNull();
  });
});
