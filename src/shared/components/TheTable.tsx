import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  RowData,
  SortingState,
  Row,
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
      default: "text-primary",
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
        default: "bg-transparent text-secondary",
        simple: "bg-transparent text-secondary",
        compact: "py-2 text-secondary",
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
      default: "hover:bg-surface-hover",
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
  /**
   * Enable row selection functionality
   */
  enableRowSelection?: boolean;
  /**
   * Callback when a row is clicked
   */
  onRowClick?: (row: T) => void;

  initialSorting?: SortingState;
}

export type RowSelectionState = Record<string, boolean>;

export type RowSelectionTableState = {
  rowSelection: RowSelectionState;
};

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
    enableRowSelection,
    onRowClick,
    initialSorting,
  } = props;

  // Local sorting state (client-side)
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Build TanStack Table instance
  const table = useReactTable({
    data: data ?? [],
    columns,
    // Sorting
    state: {
      sorting,
      ...(enableRowSelection && { rowSelection }),
    },
    onSortingChange: setSorting,
    ...(enableRowSelection && {
      onRowSelectionChange: setRowSelection,
      enableRowSelection: true,
    }),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      sorting: initialSorting,
    },
  });

  const handleRowClick = (row: Row<T>) => {
    if (enableRowSelection) {
      // Toggle row selection when clicked
      row.toggleSelected();
    }

    // Call the onRowClick callback if provided
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

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
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} className={rowVariants({ variant })}>
                {table.getHeaderGroups()[0].headers.map((header, colIndex) => {
                  // First column typically has icons + text (like token pair)
                  const isFirstColumn = colIndex === 0;
                  // Determine alignment from column meta or header
                  const cell = header.column.columnDef.cell;
                  const isRightAligned =
                    typeof cell === "function" &&
                    cell.toString().includes("justify-end");

                  return (
                    <td key={header.id} className="px-4 py-3">
                      {isFirstColumn ? (
                        // Token pair skeleton: icons + text
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="skeleton size-8 !rounded-full" />
                            <div className="skeleton absolute left-3 top-0 size-8 !rounded-full" />
                          </div>
                          <div className="skeleton h-4 w-24" />
                        </div>
                      ) : (
                        // Regular column skeleton
                        <div
                          className={cn(
                            "flex",
                            isRightAligned && "justify-end",
                          )}
                        >
                          <span className="skeleton h-4 w-16" />
                        </div>
                      )}
                    </td>
                  );
                })}
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
              <tr
                key={row.id}
                className={cn(
                  rowVariants({ variant }),
                  enableRowSelection &&
                    row.getIsSelected() &&
                    "bg-[#8866dd]/10",
                  (enableRowSelection || onRowClick) && "cursor-pointer",
                )}
                onClick={() => handleRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {cell.column.columnDef.cell
                      ? flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )
                      : cell.getValue()?.toString() || ""}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
