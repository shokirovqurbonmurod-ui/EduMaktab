"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Gauge,
  Mail,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import { WEEKDAYS_UZ, formatNumber, fullName, formatUZS } from "@/lib/utils-safe";

export default function TeacherProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { teachers, classes, subjects, students, grades, kpis, salaries, homework } = useDataStore();
  const teacher = teachers.find((t) => t.id === id);
  const { loading } = usePageData(() => teacher, [id]);

  if (loading) return <PageSkeleton withCards={false} rows={6} />;
  if (!teacher) {
    return (
      <EmptyState
        icon={<Users />}
        title="O‘qituvchi topilmadi"
        action={<Button onClick={() => router.push("/app/teachers")}><ArrowLeft /> Orqaga</Button>}
      />
    );
  }

  const subject = subjects.find((s) => s.id === teacher.subjectId);
  const myClasses = classes.filter((c) => teacher.groupsIds.includes(c.id));
  const myStudents = students.filter((s) => teacher.groupsIds.includes(s.groupId));
  const kpi = kpis.find((k) => k.teacherId === teacher.id);
  const mySalaries = salaries.filter((s) => s.teacherId === teacher.id).sort((a, b) => b.month.localeCompare(a.month));
  const myHw = homework.filter((h) => h.teacherId === teacher.id);

  const todaySlots = myClasses
    .flatMap((c) => c.schedule.map((s) => ({ ...s, cls: c })))
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="size-10" onClick={() => router.push("/app/teachers")} aria-label="Orqaga">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{fullName(teacher.lastName, teacher.firstName)}</h1>
          <p className="text-muted-foreground text-sm">{subject?.name} · {myClasses.length} ta guruh</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-warning text-warning" />
            {teacher.rating.toFixed(1)}
          </span>
          <Badge variant="success" className="num">KPI {teacher.kpiScore}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={fullName(teacher.lastName, teacher.firstName)} hue={teacher.hue} size="xl" />
            <div>
              <p className="text-lg font-bold">{fullName(teacher.lastName, teacher.firstName)}</p>
              <p className="text-muted-foreground text-sm">{subject?.name} o‘qituvchisi</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Phone className="size-3" /><span className="num">{teacher.phone}</span></span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Mail className="size-3" />{teacher.email}</span>
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-3 text-center md:max-w-md md:ml-auto">
            <div className="rounded-2xl bg-muted/60 px-3 py-3">
              <p className="num text-xl font-bold">{myStudents.length}</p>
              <p className="text-muted-foreground text-[11px]">O‘quvchi</p>
            </div>
            <div className="rounded-2xl bg-muted/60 px-3 py-3">
              <p className="num text-xl font-bold">{formatUZS(teacher.monthlySalary, { compact: true })}</p>
              <p className="text-muted-foreground text-[11px]">Maosh</p>
            </div>
            <div className="rounded-2xl bg-muted/60 px-3 py-3">
              <p className="num text-xl font-bold">{myHw.length}</p>
              <p className="text-muted-foreground text-[11px]">Uy vazifa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule">
        <TabsList className="scrollbar-none grid w-full grid-flow-col overflow-x-auto">
          <TabsTrigger value="schedule">Jadval</TabsTrigger>
          <TabsTrigger value="students">O‘quvchilar</TabsTrigger>
          <TabsTrigger value="kpi">KPI</TabsTrigger>
          <TabsTrigger value="salary">Maosh</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <CalendarDays className="size-4 text-primary" /> Haftalik jadval
              </CardTitle>
              <Badge variant="muted" className="num">{todaySlots.length} ta dars/hafta</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kun</TableHead>
                    <TableHead>Soat</TableHead>
                    <TableHead>Guruh</TableHead>
                    <TableHead>Fan</TableHead>
                    <TableHead>Xona</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySlots.slice(0, 14).map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-[13px] font-medium">{WEEKDAYS_UZ[s.day]}</TableCell>
                      <TableCell className="num text-[13px]">{s.start}–{s.end}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.cls.name}</Badge>
                      </TableCell>
                      <TableCell className="text-[13px]">{subjects.find((x) => x.id === s.subjectId)?.name}</TableCell>
                      <TableCell className="num text-[13px]">{s.room}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myStudents.slice(0, 12).map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/app/students/${s.id}`)}
                className="card-hover flex items-center gap-3 rounded-2xl border bg-card p-3.5 text-left"
              >
                <Avatar name={fullName(s.lastName, s.firstName)} hue={s.hue} size="md" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{fullName(s.lastName, s.firstName)}</p>
                  <p className="text-muted-foreground text-xs">
                    {classes.find((c) => c.id === s.groupId)?.name} · {s.avgGrade.toFixed(1)} baho
                  </p>
                </div>
                <Badge variant="muted" className="num">{s.attendanceRate}%</Badge>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kpi" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center">
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <Gauge className="size-4 text-primary" /> KPI ko‘rsatkichlari
                </CardTitle>
                <Badge variant="success" className="num">{teacher.kpiScore}/100</Badge>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {kpi ? (
                  <>
                    <KpiBar label="Davomat" value={kpi.attendance} />
                    <KpiBar label="O‘quvchilar taraqqiyoti" value={kpi.progress} />
                    <KpiBar label="Uy vazifa bajarilishi" value={kpi.homework} />
                    <KpiBar label="Ota-onalar mamnunligi" value={kpi.satisfaction} />
                    <KpiBar label="Imtihon natijalari" value={kpi.exams} />
                    <KpiBar label="Dars sifati" value={kpi.lessonQuality} />
                  </>
                ) : (
                  <p className="text-muted-foreground py-6 text-center text-sm">KPI ma'lumotlari hisoblanmoqda.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Baholar sifati</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                  <span>Qo‘yilgan baholar soni</span>
                  <span className="num font-semibold">{grades.filter((g) => g.teacherId === teacher.id).length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                  <span>O‘rtacha qo‘yilgan baho</span>
                  <span className="num font-semibold">
                    {(grades.filter((g) => g.teacherId === teacher.id).reduce((a, g) => a + g.value, 0) /
                      Math.max(1, grades.filter((g) => g.teacherId === teacher.id).length)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm">
                  <span>Ota-onalar reytingi</span>
                  <span className="num inline-flex items-center gap-1 font-semibold">
                    <Star className="size-3.5 fill-warning text-warning" /> {teacher.rating.toFixed(1)}/5
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Banknote className="size-4 text-primary" /> Maosh tarixi
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => router.push("/app/salaries")}>
                Maoshlar bo‘limi
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oy</TableHead>
                    <TableHead>Asosiy</TableHead>
                    <TableHead>Premiya</TableHead>
                    <TableHead>Chegirma</TableHead>
                    <TableHead>Jami</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mySalaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-[13px] font-medium">{s.month}</TableCell>
                      <TableCell className="num text-[13px]">{formatNumber(s.base)}</TableCell>
                      <TableCell className="num text-[13px] text-success">+{formatNumber(s.bonus)}</TableCell>
                      <TableCell className="num text-[13px] text-danger">−{formatNumber(s.deduction)}</TableCell>
                      <TableCell className="num text-[13px] font-semibold">{formatNumber(s.total)}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "paid" ? "success" : s.status === "approved" ? "info" : "warning"}>
                          {s.status === "paid" ? "To‘landi" : s.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="num font-semibold">{value}%</span>
      </div>
      <Progress value={value} classNameIndicator={value >= 85 ? "bg-success" : value >= 70 ? "bg-primary" : "bg-warning"} />
    </div>
  );
}
