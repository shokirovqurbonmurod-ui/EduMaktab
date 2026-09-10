"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  /** hide this column on smaller screens: "sm" | "md" | "lg" */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  empty?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  skeletonRows?: number;
  className?: string;
}

const hideMap = { sm: "max-sm:hidden", md: "max-md:hidden", lg: "max-lg:hidden" } as const;

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  loading,
  empty,
  pageSize = 10,
  onRowClick,
  mobileCard,
  initialSort,
  skeletonRows = 8,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [data.length, sort]);

  const sorted = React.useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const sv = col.sortValue;
    return [...data].sort((a, b) => {
      const va = sv(a);
      const vb = sv(b);
      const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "uz");
      return sort.dir === "asc" ? r : -r;
    });
  }, [data, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  /* ---------- mobile cards ---------- */
  if (mobileCard) {
    return (
      <div className={cn("space-y-3 md:hidden", className)}>
        {loading
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : rows.length === 0
            ? empty
            : rows.map((row) => mobileCard(row))}
        {!loading && pages > 1 ? <Pagination page={safePage} pages={pages} onPage={setPage} total={sorted.length} pageSize={pageSize} /> : null}
      </div>
    );
  }

  /* ---------- desktop table ---------- */
  return (
    <div className={cn("rounded-2xl border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className={cn(c.headerClassName, c.hideBelow && hideMap[c.hideBelow])}>
                {c.sortable ? (
                  <button
                    onClick={() => toggleSort(c.key)}
                    className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    {c.header}
                    {sort?.key === c.key ? (
                      sort.dir === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  c.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(c.hideBelow && hideMap[c.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.length === 0
              ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="h-32">
                      {empty}
                    </TableCell>
                  </TableRow>
                )
              : rows.map((row) => (
                  <TableRow
                    key={getRowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key} className={cn(c.className, c.hideBelow && hideMap[c.hideBelow])}>
                        {c.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
        </TableBody>
      </Table>
      {!loading && pages > 1 ? (
        <div className="border-t px-3 py-3">
          <Pagination page={safePage} pages={pages} onPage={setPage} total={sorted.length} pageSize={pageSize} />
        </div>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  pages,
  onPage,
  total,
  pageSize,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  total: number;
  pageSize: number;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i++) nums.push(i);
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-muted-foreground num text-xs">
        {from}–{to} / {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Oldingi sahifa">
          <ChevronLeft />
        </Button>
        {nums.map((n) => (
          <Button
            key={n}
            variant={n === page ? "default" : "ghost"}
            size="icon"
            className="size-8 num text-xs"
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </Button>
        ))}
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Keyingi sahifa">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
