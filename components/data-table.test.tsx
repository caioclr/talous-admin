import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/data-table";

describe("DataTable", () => {
  const columns = [
    {
      key: "name",
      header: "Nome",
      render: (row: { name: string }) => row.name,
    },
  ];

  it("renders empty state", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Sem registros"
      />,
    );

    expect(screen.getByText("Sem registros")).toBeInTheDocument();
  });

  it("calls pagination callback", () => {
    const onPageChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[{ name: "Petrobras" }]}
        pagination={{
          page: 1,
          page_size: 20,
          total: 40,
          total_pages: 2,
        }}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /proxima/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
