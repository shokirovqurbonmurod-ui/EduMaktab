"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Medal,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import { PAYMENT_META, StatusBadge } from "@/components/shared/StatusBadge";
import {
  formatDateUZ,
  formatDateShortUZ,
  formatUZS,
  fullName,
  relativeDayUZ,
} from "@/lib/utils";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { students, classes, parents, grades, attendance, payments, homework, exams, subjects } = useDataStore();
  const student = students.find((s) => s.id === id);
  const { loading } = usePageData(() => student, [id]);

  if (loading) return <PageSkeleton withCards={false} rows={6} />;
  if (!student) {
    return (
      <EmptyState
        icon={<UserRound />}
        title="O‘quvchi topilmadi"
        description="Ro‘yxatga qaytish: ID o‘zgargan bo‘lishi mumkin."
        action={
          <Button onClick={() => router.push("/app/students")}>
            <ArrowLeft /> Orqaga
          </Button>
        }
      />
    );
  }

  const cls = classes.find((c) => c.id === student.groupId);
  const parent = parents.find((p) => student.parentIds.includes(p.id));
  const myGrades = grades.filter((g) => g.studentId === student.id);
  const myAtt = attendance.filter((a) => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const myPays = payments.filter((p) => p.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const myHw = homework.filter((h) => h.classId === student.groupId);
  const myExams = exams.filter((e) => e.classId === student.groupId);

  const bySubject = subjects
    .map((sub) => {
      const list = myGrades.filter((g) => g.subjectId === sub.id);
      if (list.length === 0) return null;
      return { sub, list, avg: list.reduce((a, g) => a + g.value, 0) / list.length };
    })
    .filter((x): x is { sub: (typeof subjects)[number]; list: typeof myGrades; avg: number } => x != null);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="size-10" onClick={() => router.push("/app/students")} aria-label="Orqaga">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{fullName(student.lastName, student.firstName)}</h1>
          <p className="text-muted-foreground num text-sm">{student.code} · {cls?.name}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <StatusBadge tone={PAYMENT_META[student.paymentStatus].tone}>{PAYMENT_META[student.paymentStatus].label}</StatusBadge>
          <Badge variant="success" className="num">{student.attendanceRate}% davomat</Badge>
        </div>
      </div>

      <Card className="brand-gradient-soft border-primary/15">
        <CardContent className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={fullName(student.lastName, student.firstName)} hue={student.hue} size="xl" />
            <div>
              <p className="text-lg font-bold">{fullName(student.lastName, student.firstName)}</p>
              <p className="text-muted-foreground text-sm capitalize">
                {student.gender === "male" ? "Erkak" : "Ayol"} · {formatDateUZ(student.birthDate)} · {cls?.room}-xona
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{cls?.name} guruh</Badge>
                <Badge variant={student.paymentStatus === "paid" ? "success" : student.paymentStatus === "partial" ? "warning" : "danger"}>
                  {PAYMENT_META[student.paymentStatus].label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-3 text-center md:max-w-md md:ml-auto">
            <div className="rounded-2xl bg-card/70 px-3 py-3 backdrop-blur-sm">
              <p className="num text-xl font-bold">{student.avgGrade.toFixed(1)}</p>
              <p className="text-muted-foreground text-[11px]">O‘rtacha baho</p>
            </div>
            <div className="rounded-2xl bg-card/70 px-3 py-3 backdrop-blur-sm">
              <p className="num text-xl font-bold">{student.attendanceRate}%</p>
              <p className="text-muted-foreground text-[11px]">Davomat</p>
            </div>
            <div className="rounded-2xl bg-card/70 px-3 py-3 backdrop-blur-sm">
              <p className="num text-xl font-bold">{student.certificates.length}</p>
              <p className="text-muted-foreground text-[11px]">Sertifikat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic">
        <TabsList className="scrollbar-none grid w-full grid-flow-col overflow-x-auto">
          <TabsTrigger value="basic">Asosiy</TabsTrigger>
          <TabsTrigger value="academy">Akademik</TabsTrigger>
          <TabsTrigger value="attendance">Davomat</TabsTrigger>
          <TabsTrigger value="payments">To‘lovlar</TabsTrigger>
          <TabsTrigger value="homework">Uy vazifalar</TabsTrigger>
          <TabsTrigger value="certs">Sertifikatlar</TabsTrigger>
          <TabsTrigger value="behavior">Xatti-harakat</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <UserRound className="size-4 text-primary" /> Shaxsiy ma'lumot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="F.I.Sh." value={fullName(student.lastName, student.firstName)} />
                <InfoRow label="Ildiz" value={student.code} mono />
                <InfoRow label="Tug'ilgan sana" value={formatDateUZ(student.birthDate)} />
                <InfoRow label="Guruh" value={cls ? `${cls.name} (${cls.type === "class" ? "asosiy" : "qo'shimcha"})` : "—"} />
                <InfoRow label="Kirish sanasi" value={formatDateUZ(student.joinDate)} />
                <InfoRow label="Manzil" value={student.address ?? "—"} />
                {student.phone ? <InfoRow label="Telefon" value={student.phone} mono /> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <Phone className="size-4 text-primary" /> Ota-ona
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={parent.name} hue={parent.hue} />
                      <div>
                        <p className="font-medium">{parent.name}</p>
                        <p className="text-muted-foreground text-xs">{parent.occupation ?? "—"}</p>
                      </div>
                    </div>
                    <Separator />
                    <InfoRow label="Telefon" value={parent.phone} mono />
                    <InfoRow label="Manzil" value={parent.address ?? "—"} />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Ota-ona ma'lumotlari kiritilmagan.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academy" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center">
                <CardTitle className="text-[15px]">Fanlar bo‘yicha baho</CardTitle>
                <Badge variant="secondary" className="num">O‘rtacha: {student.avgGrade.toFixed(1)}/10</Badge>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {bySubject.map(({ sub, avg }) => (
                  <div key={sub.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{sub.name}</span>
                      <span className="num font-semibold">{avg.toFixed(1)}/10</span>
                    </div>
                    <Progress value={avg * 10} classNameIndicator={avg >= 8 ? "bg-success" : avg >= 6 ? "bg-primary" : "bg-warning"} />
                  </div>
                ))}
                {bySubject.length === 0 ? <p className="text-muted-foreground py-6 text-center text-sm">Baho ma'lumotlari yo‘q.</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center">
                <CardTitle className="text-[15px]">So‘nggi baholar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myGrades.slice(0, 8).map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="brand-gradient-soft flex size-8 items-center justify-center rounded-lg text-[10px] font-bold text-primary">
                        {subjects.find((s) => s.id === g.subjectId)?.shortName}
                      </span>
                      <div className="leading-tight">
                        <p className="font-medium">{subjects.find((s) => s.id === g.subjectId)?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {gradeTypeLabel(g.type)} · {relativeDayUZ(g.date)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={g.value >= 8 ? "success" : g.value >= 6 ? "secondary" : "warning"} className="num">
                      {g.value}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <ClipboardCheck className="size-4 text-primary" /> So‘nggi davomat
              </CardTitle>
              <Badge variant="success" className="num">{student.attendanceRate}% umumiy</Badge>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {myAtt.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                  <span className="text-muted-foreground">{formatDateShortUZ(a.date)} {a.time ? `· ${a.time}` : ""}</span>
                  <StatusBadge tone={a.status === "present" ? "success" : a.status === "late" ? "warning" : a.status === "absent" ? "danger" : "info"}>
                    {a.status === "present" ? "Keldi" : a.status === "late" ? "Kechikdi" : a.status === "absent" ? "Kelmagan" : "Sababli"}
                  </StatusBadge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Wallet className="size-4 text-primary" /> To‘lov tarixi
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                <Link href="/app/payments">Moliya bo‘limi <Wallet className="size-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {myPays.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-xl ${p.status === "paid" ? "bg-success-soft text-success" : p.status === "partial" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"}`}>
                      <Wallet className="size-4" />
                    </span>
                    <div className="leading-tight">
                      <p className="num font-medium">{formatUZS(p.amount)}</p>
                      <p className="text-muted-foreground text-xs">{formatDateUZ(p.date)} · {p.method === "cash" ? "Naqd" : p.method === "card" ? "Karta" : "Bank"}</p>
                    </div>
                  </div>
                  <StatusBadge tone={PAYMENT_META[p.status].tone}>{PAYMENT_META[p.status].label}</StatusBadge>
                </div>
              ))}
              {myPays.length === 0 ? <p className="text-muted-foreground py-6 text-center text-sm">To‘lovlar topilmadi.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <BookOpenCheck className="size-4 text-primary" /> Guruh uy vazifalari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myHw.slice(0, 6).map((h) => {
                const submitted = h.submissions.some((s) => s.studentId === student.id);
                return (
                  <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{h.title}</p>
                      <p className="text-muted-foreground text-xs">Muddat: {formatDateUZ(h.dueDate)}</p>
                    </div>
                    {submitted ? (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3" /> Topshirilgan
                      </Badge>
                    ) : (
                      <Badge variant="muted">Kutilmoqda</Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs" className="mt-4">
          {student.certificates.length === 0 ? (
            <EmptyState icon={<Medal />} title="Hali sertifikat yo‘q" description="O‘quvchi yutuqlari shu yerda ko‘rsatiladi." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {student.certificates.map((c) => (
                <Card key={c.id} className="card-hover">
                  <CardContent className="flex items-start gap-3">
                    <span className="brand-gradient-soft flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary">
                      <Medal className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{c.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {c.issuer} · {formatDateUZ(c.date)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="behavior" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center">
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <ShieldCheck className="size-4 text-primary" /> Xatti-harakat bahosi
                </CardTitle>
                <Badge variant="success" className="num">{student.behaviorScore}/100</Badge>
              </CardHeader>
              <CardContent>
                <Progress value={student.behaviorScore} classNameIndicator="bg-success" />
                <p className="text-muted-foreground mt-3 text-sm">
                  O‘qituvchilar tomonidan baholangan: mas’uliyat, tarbiya va jamoada ishtirok.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <CalendarDays className="size-4 text-primary" /> Imtihonlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myExams.slice(0, 4).map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="text-muted-foreground text-xs">{formatDateUZ(e.date)} · {e.durationMin} daqiqa</p>
                    </div>
                    <Badge variant={e.status === "finished" ? "success" : "secondary"}>
                      {e.status === "finished" ? "Tugagan" : "Rejada"}
                    </Badge>
                  </div>
                ))}
                {myExams.length === 0 ? <p className="text-muted-foreground text-sm">Rejada imtihon yo‘q.</p> : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-[13px]">{label}</span>
      <span className={`text-right text-[13px] font-medium ${mono ? "num" : ""}`}>{value}</span>
    </div>
  );
}

export function gradeTypeLabel(t: string): string {
  switch (t) {
    case "homework":
      return "Uy vazifasi";
    case "test":
      return "Test";
    case "exam":
      return "Imtihon";
    case "participation":
      return "Faollik";
    default:
      return t;
  }
}
