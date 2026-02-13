import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useMemo } from "react";

export default function LogsTable({ data, onRowClick }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: "ts",
        header: "Time",
      },
      {
        accessorKey: "method",
        header: "Method",
      },
      {
        accessorKey: "path",
        header: "Path",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "latency_ms",
        header: "Latency (ms)",
      },
      {
        accessorKey: "country",
        header: "Country",
      },
      {
        accessorKey: "ip",
        header: "IP",
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table border="1" cellPadding="8" style={{ width: "100%" }}>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr
            key={row.id}
            style={{ cursor: "pointer" }}
            onClick={() => onRowClick(row.original)}
          >
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell ??
                    cell.column.columnDef.accessorKey,
                  cell.getContext()
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
