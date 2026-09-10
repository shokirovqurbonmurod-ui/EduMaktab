"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessageCircle, Phone, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { NoResults } from "@/components/shared/states";
import { formatDateUZ, fullName, useDebouncedSafe } from "@/lib/utils-safe";
import type { Parent } from "@/lib/types";

export default function ParentsPage() {
  const { parents, students, classes } = useDataStore();
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fClass, setFClass] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { loading } = usePageData(() => parents, []);

  const classIds = Array.from(new Set(students.map((s) => s.groupId))).sort();
  const clsName = (id: string) => classes.find((c) => c.id === id)?.name ?? id;
  const childrenOf = (p: Parent) => students.filter((s) => p.childrenIds.includes(s.id));
  const activePct = (p: Parent) => {
    const kids = childrenOf(p);
    if (kids.length === 0) return 0;
    return Math.round((kids.filter((k) => k.status === "active").length / kids.length) * 100);
  };

  const filtered = parents
    .filter((p) => (fClass === "all" ? true : childrenOf(p).some((s) => s.groupId === fClass)))
    .filter(
      (p) =>
        !dq ||
        p.name.toLowerCase().includes(dq.toLowerCase()) ||
        p.phone.toLowerCase().includes(dq.toLowerCase()) ||
        childrenOf(p)
          .map((s) => fullName(s.lastName, s.firstName))
          .some((n) => n.toLowerCase().includes(dq.toLowerCase())),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const selected = parents.find((p) => p.id === selectedId) ?? null;

  const columns: Column<Parent>[] = [
    {
      key: "name",
      header: "Ota-ona",
      sortable: true,
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} hue={p.hue} size="sm" />
          <div className="leading-tight">
            <p className="font-medium">{p.name}</p>
            <p className="text-muted-foreground text-xs">{p.occupation ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefon",
      hideBelow: "md",
      cell: (p) => <span className="num text-sm">{p.phone}</span>,
    },
    {
      key: "children",
      header: "Farzand(lar)",
      sortable: true,
      sortValue: (p) => childrenOf(p).length,
      cell: (p) => {
        const kids = childrenOf(p);
        return (
          <div className="flex flex-wrap gap-1">
            {kids.map((k) => (
              <Badge key={k.id} variant="secondary" className="text-[11px]">
                {k.firstName} · {clsName(k.groupId)}
              </Badge>
            ))}
            {kids.length === 0 ? <span className="text-muted-foreground text-xs">—</span> : null}
          </div>
        );
      },
    },
    {
      key: "active",
      header: "Faollik",
      sortable: true,
      sortValue: (p) => activePct(p),
      cell: (p) => <Badge variant={activePct(p) === 100 ? "success" : "warning"}>{activePct(p)}%</Badge>,
    },
    {
      key: "status",
      header: "Holat",
      hideBelow: "lg",
      cell: (p) => (
        <Badge variant={p.status === "active" ? "success" : "muted"}>
          {p.status === "active" ? "Faol" : "Faol emas"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (p) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          onClick={() => setSelectedId(p.id)}
          aria-label="Profilini ochish"
        >
          <UserCheck className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Ota-onalar" subtitle={`${parents.length} ta ota-ona`} />

      <Card className="mt-6">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={q} onChange={setQ} placeholder="Ism, telefon yoki farzand bo‘yicha…" className="flex-1" />
            <FilterBar>
              <Select value={fClass} onValueChange={setFClass}>
                <SelectTrigger size="sm" className="w-40" aria-label="Sinf filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha sinf</SelectItem>
                  {classIds.map((c) => (
                    <SelectItem key={c} value={c}>
                      {clsName(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterBar>
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            getRowKey={(p) => p.id}
            loading={loading}
            pageSize={12}
            empty={<NoResults query={dq} />}
            mobileCard={(p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors active:bg-accent/40"
              >
                <Avatar name={p.name} hue={p.hue} size="md" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="num text-muted-foreground text-xs">{p.phone}</p>
                </div>
                <Badge variant={activePct(p) === 100 ? "success" : "warning"}>{activePct(p)}%</Badge>
              </button>
            )}
          />
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        {selected ? (
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <Avatar name={selected.name} hue={selected.hue} size="md" />
                {selected.name}
              </SheetTitle>
              <SheetDescription>
                {selected.phone} · {selected.occupation ?? "Ma'lumot yo‘q"}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <div>
                <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                  <Users className="size-3.5" /> Farzandlari
                </p>
                <div className="space-y-2">
                  {childrenOf(selected).map((k) => (
                    <div key={k.id} className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
                      <Avatar name={fullName(k.lastName, k.firstName)} hue={k.hue} size="sm" />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-medium">{fullName(k.lastName, k.firstName)}</p>
                        <p className="text-muted-foreground text-xs">
                          {clsName(k.groupId)} sinf · {formatDateUZ(k.joinDate)} dan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num text-sm font-semibold">{Math.round(k.avgGrade * 10) / 10}/10</p>
                        <p className="num text-muted-foreground text-[10px]">{k.attendanceRate}% davomat</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">To‘lov holati</p>
                <div className="space-y-2">
                  {childrenOf(selected).map((k) => (
                    <div key={k.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
                      <span className="text-sm">
                        {k.firstName} — {clsName(k.groupId)}
                      </span>
                      <Badge
                        variant={k.paymentStatus === "paid" ? "success" : k.paymentStatus === "partial" ? "warning" : "danger"}
                      >
                        {k.paymentStatus === "paid" ? "To‘lovda" : k.paymentStatus === "partial" ? "Qisman" : "Qarzdor"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              {selected.notes ? (
                <p className="rounded-xl bg-muted p-3.5 text-sm leading-relaxed">{selected.notes}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success("Xabar yuborildi", {
                      description: `${selected.name} ga xabar yuborildi (demo).`,
                    });
                  }}
                >
                  <MessageCircle className="size-4" /> Xabar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success("Qo‘ng‘iroq", {
                      description: `${selected.phone} raqamiga qo‘ng‘iroq (demo).`,
                    });
                  }}
                >
                  <Phone className="size-4" /> Qo‘ng‘iroq
                </Button>
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </>
  );
}
