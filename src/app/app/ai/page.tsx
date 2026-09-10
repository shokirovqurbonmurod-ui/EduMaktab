"use client";

import * as React from "react";
import { AlertTriangle, BarChart3, Send, Sparkles, TrendingUp, Wand2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDataStore } from "@/stores/useDataStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton } from "@/components/shared/states";
import {
  addDaysISO,
  formatPercent,
  formatTimeUZ,
  formatUZS,
  formatUZSCompact,
  fullName,
  todayISO,
  uid,
} from "@/lib/utils-safe";
import { attendanceCountByStatus, attendanceRatePct, kpiRanking, monthFinance, subjectAverages, classPerformance } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface AiMsg {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  "Bugungi moliya holati qanday?",
  "Qaysi guruhda davomat past?",
  "CRM da nechta faol lid bor?",
  "Eng kuchli 3 o‘qituvchi kimlar?",
  "Oylik xulosani tuzing",
];

function buildAnswer(q: string, store: ReturnType<typeof useDataStore.getState>): string {
  const s = store;
  const t = q.toLowerCase();
  const today = todayISO();
  const monthKey = today.slice(0, 7);
  const fin = monthFinance(s.payments, monthKey);

  if (t.includes("hisobot") || t.includes("xulosa")) {
    const att = attendanceRatePct(s.attendance, today);
    const debt = fin.debt;
    const leads = s.leads.filter((l) => !["accepted", "rejected"].includes(l.stage)).length;
    const topTeacher = kpiRanking(s.kpis, s.teachers, 1)[0];
    const lines = [
      `**${today} — maktab holati**`,
      "",
      `• Davomat: ${formatPercent(att)} (bugun)`,
      `• Tushum (oy): ${formatUZS(fin.paid + fin.partial)} — ${fin.count} ta to'lov`,
      `• Qarzdorlik: ${formatUZS(fin.debt)}${debt > 0 ? " — e'tibor talab etiladi" : ""}`,
      `• Xarajatlar: ${formatUZS(s.expenses.filter((e) => e.date.slice(0, 7) === monthKey).reduce((a, e) => a + e.amount, 0))}`,
      `• Faol CRM lid: ${leads} ta`,
    ];
    if (topTeacher) lines.push(`• Eng yuqori KPI: ${fullName(topTeacher.teacher.lastName, topTeacher.teacher.firstName)} (${topTeacher.kpi.total}/100)`);
    return lines.join("\n");
  }

  if (t.includes("to'lov") || t.includes("tushum") || t.includes("moliya") || t.includes("karz") || t.includes("daromad")) {
    const daysAgo = addDaysISO(today, -29);
    const recent = s.payments.filter((p) => p.date >= daysAgo);
    const recentTotal = recent.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
    const methods = new Map<string, number>();
    recent.forEach((p) => methods.set(p.method, (methods.get(p.method) ?? 0) + p.amount));
    const methodLine = Array.from(methods.entries())
      .map(([m, v]) => `${m === "cash" ? "naqd" : m === "card" ? "karta" : "bank"}da ${formatUZSCompact(v)}`)
      .join(", ");
    return (
      `**Moliya (joriy oy)**\n` +
      `• To'langan: ${formatUZS(fin.paid)}\n` +
      `• Qisman: ${formatUZS(fin.partial)}\n` +
      `• Kutilayotgan (qarzdorlik): ${formatUZS(fin.debt)}\n` +
      `• So'nggi 30 kun: ${formatUZS(recentTotal)} — ${recent.length} ta operatsiya\n` +
      `• Usullar: ${methodLine || "ma'lumot yo'q"}`
    );
  }

  if (t.includes("davomat")) {
    const todayAtt = attendanceCountByStatus(s.attendance, today);
    const pct = attendanceRatePct(s.attendance, today);
    const weekAgo = addDaysISO(today, -6);
    const weekRecs = s.attendance.filter((a) => a.date >= weekAgo);
    const weekPct = weekRecs.length
      ? Math.round((weekRecs.filter((a) => a.status !== "absent").length / weekRecs.length) * 1000) / 10
      : 0;
    return (
      `**Davomat holati**\n` +
      `• Bugun: ${formatPercent(pct)} — ${todayAtt.present} ta keldi, ${todayAtt.late} ta kechikdi, ${todayAtt.absent} ta kelmadi\n` +
      `• So'nggi 7 kun o'rtachasi: ${formatPercent(weekPct)}\n` +
      `• Kechikkan o'quvchilarni Davomat bo'limida ko'ring`
    );
  }

  if (t.includes("guruh") || t.includes("sinf") || t.includes("past")) {
    const perf = classPerformance(s.classes);
    const worst = [...perf].sort((a, b) => a.result - b.result).slice(0, 3);
    const best = perf.slice(0, 3);
    return (
      `**Guruhlar samaradorligi**\n` +
      `• Eng yuqori: ${best.map((c) => `${c.name} (${c.result}%)`).join(", ")}\n` +
      `• E'tibor kerak: ${worst.map((c) => `${c.name} (${c.result}%, davomat ${c.attendance}%)`).join(", ")}\n` +
      `• Tavsiya: past natijali guruhlar bilan bir hafta ichida tahlil o'tkazing`
    );
  }

  if (t.includes("lid") || t.includes("crm") || t.includes("qabul")) {
    const byStage = new Map<string, number>();
    s.leads.forEach((l) => byStage.set(l.stage, (byStage.get(l.stage) ?? 0) + 1));
    const active = s.leads.filter((l) => !["accepted", "rejected"].includes(l.stage));
    const value = active.reduce((a, l) => a + l.value, 0);
    return (
      `**CRM holati**\n` +
      `• Jami lid: ${s.leads.length} ta\n` +
      `• Faol (jarayonda): ${active.length} ta — potensial ${formatUZS(value)}/oy\n` +
      `• Bosqichlar: ${Array.from(byStage.entries()).map(([st, n]) => `${st}: ${n}`).join(", ")}\n` +
      `• Bugun bug'daydi: "new" va "contacted" bosqichidagi liddar bilan bog'laning`
    );
  }

  if (t.includes("o'qituvchi") || t.includes("kpi")) {
    const top = kpiRanking(s.kpis, s.teachers, 3);
    return (
      `**Eng yuqori KPI'li o'qituvchilar**\n` +
      top
        .map(
          (x, i) =>
            `${i + 1}. ${fullName(x.teacher.lastName, x.teacher.firstName)} — ${x.kpi.total}/100 ${x.kpi.trend >= 0 ? "↗" : "↘"}`,
        )
        .join("\n") +
      `\n• Detal KPI sahifasida radar-diagramma bor`
    );
  }

  if (t.includes("imtihon") || t.includes("test") || t.includes("nazorat")) {
    const finished = s.exams.filter((e) => e.status === "finished").length;
    const scheduled = s.exams.filter((e) => e.status === "scheduled");
    return (
      `**Imtihonlar**\n` +
      `• Yakunlangan: ${finished} ta\n` +
      `• Rejadagi: ${scheduled.length} ta${scheduled.length ? ` — eng yaqini: ${scheduled[0]?.title} (${scheduled[0]?.date})` : ""}\n` +
      `• Natijalar Imtihonlar bo'limida`
    );
  }

  if (t.includes("xarajat")) {
    const total = s.expenses.filter((e) => e.date.slice(0, 7) === monthKey).reduce((a, e) => a + e.amount, 0);
    const byCat = new Map<string, number>();
    s.expenses.filter((e) => e.date.slice(0, 7) === monthKey).forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const topCat = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return (
      `**Xarajatlar (joriy oy)**\n` +
      `• Jami: ${formatUZS(total)}\n` +
      `• Eng katta bandlar: ${topCat.map(([c, v]) => `${c} — ${formatUZSCompact(v)}`).join(", ") || "—"}`
    );
  }

  return (
    "Sizga quyidagilar bo'yicha yordam bera olaman:\n" +
    "• Moliya: to'lovlar, tushum, qarzdorlik\n" +
    "• Davomat: bugungi va haftalik holat\n" +
    "• Guruhlar: samaradorlik tahlili\n" +
    "• CRM: lidlar va qabul jarayoni\n" +
    "• KPI: o'qituvchilar baholari\n" +
    "• Imtihonlar va xarajatlar\n" +
    "Yuqoridagi tezkor savollardan birini bosing yoki o'z savolingizni yozing."
  );
}

export default function AiPage() {
  const store = useDataStore();
  const me = useAuthStore((s) => s.session?.user) ?? null;
  const [messages, setMessages] = React.useState<AiMsg[]>([
    {
      id: "ai_greeting",
      role: "ai",
      text: `Assalomu alaykum, ${me?.name?.split(" ")[0] ?? "Direktor"}! Men SchoolOS AI yordamchisiman. Maktab holati bo'yicha savol bering — real ma'lumotlarga tayanib javob beraman.`,
      time: new Date().toISOString(),
    },
  ]);
  const [draft, setDraft] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const replySeq = React.useRef(0);
  const { loading } = usePageData(() => store.payments, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setDraft("");
    const userMsg: AiMsg = { id: uid("ai"), role: "user", text: q, time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);
    setTimeout(() => {
      const answer = buildAnswer(q, useDataStore.getState());
      setMessages((m) => [...m, { id: uid("ai"), role: "ai", text: answer, time: new Date().toISOString() }]);
      setThinking(false);
    }, 700 + ((replySeq.current++ % 5) * 140));
  };

  if (loading) return <PageSkeleton withCards={false} rows={6} />;

  return (
    <>
      <PageHeader
        title="SchoolOS AI"
        subtitle="Maktab ma'lumotlari bo'yicha aqlli yordamchi"
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" /> Demo rejim
          </Badge>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <div className="flex h-[70dvh] flex-col">
            <div className="glass flex items-center gap-3 border-b px-4 py-3">
              <div className="brand-gradient flex size-9 items-center justify-center rounded-xl text-white">
                <Wand2 className="size-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">SchoolOS AI</p>
                <p className="text-success text-xs">onlayn · javob ~1s</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() =>
                  setMessages([
                    {
                      id: uid("ai"),
                      role: "ai",
                      text: "Suhbat tozalandi. Yangi savol bering!",
                      time: new Date().toISOString(),
                    },
                  ])
                }
              >
                <X className="size-3.5" /> Tozalash
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                    {m.role === "ai" ? (
                      <div className="brand-gradient mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl text-white">
                        <Sparkles className="size-4" />
                      </div>
                    ) : (
                      <Avatar name={me?.name ?? "Men"} hue={me?.avatarHue} size="sm" className="mt-1" />
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        m.role === "ai" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
                      )}
                    >
                      {m.text}
                      <p className={cn("num mt-1 text-right text-[10px]", m.role === "ai" ? "text-muted-foreground" : "text-primary-foreground/60")}>
                        {formatTimeUZ(m.time)}
                      </p>
                    </div>
                  </div>
                ))}
                {thinking ? (
                  <div className="flex gap-3">
                    <div className="brand-gradient mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl text-white">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="bg-muted flex items-center gap-1 rounded-2xl px-4 py-3.5">
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-3">
              <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => ask(p)}
                    disabled={thinking}
                    className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="bg-muted flex items-center gap-2 rounded-full p-1.5">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask(draft)}
                  placeholder="Savol yozing… masalan: oylik tushum qancha?"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button size="icon" className="size-10 shrink-0 rounded-full" onClick={() => ask(draft)} disabled={!draft.trim() || thinking} aria-label="Yuborish">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="text-primary size-4" /> Imkoniyatlar
              </p>
              <ul className="space-y-2 text-[13px] leading-snug">
                <li className="flex gap-2">
                  <TrendingUp className="text-success mt-0.5 size-3.5 shrink-0" />
                  Moliya tahlili: tushum, qarzdorlik, xarajatlar
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="text-warning mt-0.5 size-3.5 shrink-0" />
                  Xavf signalari: past davomat, kechikkan to'lovlar
                </li>
                <li className="flex gap-2">
                  <Sparkles className="text-primary mt-0.5 size-3.5 shrink-0" />
                  Tayyor xulosalar: kunlik va oylik hisobotlar
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Tezkor ko'rsatkichlar</p>
              <MiniKpi label="Bugungi davomat" value={formatPercent(attendanceRatePct(store.attendance, todayISO()))} />
              <MiniKpi
                label="Oylik tushum"
                value={formatUZSCompact(monthFinance(store.payments, todayISO().slice(0, 7)).revenue)}
              />
              <MiniKpi
                label="Faol lidlar"
                value={String(store.leads.filter((l) => !["accepted", "rejected"].includes(l.stage)).length)}
              />
              <MiniKpi
                label="Fanlar o'rtachasi"
                value={(subjectAverages(store.grades).reduce((a, s) => a + s.avg, 0) / Math.max(1, subjectAverages(store.grades).length)).toFixed(1) + "/10"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary size-4.5" />
                </div>
                <div className="text-[13px] leading-snug">
                  <p className="font-medium">Ishlash tizimi</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Javoblar mahalliy demo ma'lumotlar asosida real vaqtda hisoblanadi. Keyingi bosqichda
                    LLM-birlashtirish orqali taqdim etiladi — arxitektura tayyor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="num text-sm font-bold">{value}</span>
    </div>
  );
}
