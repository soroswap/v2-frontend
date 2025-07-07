import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  RowData,
  SortingState,
} from "@tanstack/react-table";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils/cn";

/**
 * Table style variants powered by class-variance-authority (CVA).
 * Adjust these classes to match the design-system once tokenized
 * color variables are available in `globals.css`.
 */
const tableVariants = cva("w-full text-left", {
  variants: {
    variant: {
      default: "text-white",
      simple: "text-white border-collapse",
      compact: "text-white text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const headerVariants = cva(
  "px-4 py-3 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-transparent text-[#A0A3C4]",
        simple: "bg-transparent text-[#A0A3C4]",
        compact: "py-2 text-[#A0A3C4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const rowVariants = cva("border-b border-[#23243a] transition-colors", {
  variants: {
    variant: {
      default: "hover:bg-[#10121A]",
      simple: "hover:bg-[#10121A]/70",
      compact: "hover:bg-[#10121A] text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface TheTableProps<T extends RowData>
  extends VariantProps<typeof tableVariants> {
  /**
   * Column definitions compatible with TanStack Table
   */
  columns: ColumnDef<T, unknown>[];
  /**
   * Data to render
   */
  data: T[];
  /**
   * Display skeleton rows while loading
   */
  isLoading?: boolean;
  /**
   * Qty of skeleton rows (defaults to 5)
   */
  skeletonRows?: number;
  /**
   * Allows overriding how a row key is extracted
   */
  getRowId?: (originalRow: T, index: number) => string;
  /**
   * Optional empty state label
   */
  emptyLabel?: string;
  /**
   * Additional table className
   */
  className?: string;
}

export function TheTable<T extends RowData>(props: TheTableProps<T>) {
  const {
    columns,
    data,
    variant,
    isLoading,
    skeletonRows = 5,
    getRowId,
    emptyLabel = "No data to display",
    className,
  } = props;

  // Local sorting state (client-side)
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Build TanStack Table instance
  const table = useReactTable({
    data: data ?? [],
    columns,
    // Sorting
    state: { sorting },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-auto">
      <table className={cn(tableVariants({ variant }), className)}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="whitespace-nowrap">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={headerVariants({ variant })}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} className={rowVariants({ variant })}>
                <td colSpan={columns.length} className="p-4">
                  <div className="skeleton h-4 w-full" />
                </td>
              </tr>
            ))}

          {!isLoading && table.getRowModel().rows.length === 0 && (
            <tr className={rowVariants({ variant })}>
              <td colSpan={columns.length} className="p-4 text-center text-sm">
                {emptyLabel}
              </td>
            </tr>
          )}

          {!isLoading &&
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={rowVariants({ variant })}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
