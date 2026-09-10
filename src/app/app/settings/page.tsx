"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  KeyRound,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useDataStore } from "@/stores/useDataStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: "Direktor",
  ADMIN: "Admin",
  TEACHER: "O‘qituvchi",
  STUDENT: "O‘quvchi",
  PARENT: "Ota-ona",
  ACCOUNTANT: "Buxgalter",
  RECEPTION: "Qabul xodimi",
};

const profileSchema = z.object({
  name: z.string().min(3, "Ism kiriting"),
  phone: z.string().min(9, "Telefon raqamini kiriting"),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current: z.string().min(1, "Joriy parolni kiriting"),
    next: z.string().min(8, "Yangi parol kamida 8 belgi"),
    confirm: z.string().min(1, "Parolni takrorlang"),
  })
  .refine((v) => v.next === v.confirm, { message: "Parollar mos kelmadi", path: ["confirm"] });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const me = useAuthStore((s) => s.session?.user) ?? null;
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const resetDemo = useDataStore((s) => s.resetDemo);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [notifs, setNotifs] = React.useState({
    payments: true,
    attendance: true,
    crm: false,
    digest: true,
  });

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { name: me?.name ?? "", phone: me?.phone ?? "" },
  });

  const {
    register: regPass,
    handleSubmit: submitPass,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });

  React.useEffect(() => {
    if (me) resetProfile({ name: me.name, phone: me.phone });
  }, [me, resetProfile]);

  const saveProfile = (v: ProfileValues) => {
    toast.success("Profil yangilandi", { description: `${v.name} — ${v.phone}` });
  };

  const savePassword = () => {
    resetPass();
    toast.success("Parol yangilandi", { description: "Yangi parol endi faol (demo)." });
  };

  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Hisob, tashqi ko‘rinish va tizim sozlamalari" />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <User className="text-primary size-4.5" /> Profil
            </CardTitle>
            <CardDescription>Shaxsiy ma'lumotlaringiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <Avatar name={me?.name ?? "?"} hue={me?.avatarHue} size="lg" />
              <div>
                <p className="font-semibold">{me?.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">{ROLE_LABELS[me?.role ?? "DIRECTOR"] ?? me?.role}</Badge>
                  <span className="text-muted-foreground text-xs">sch_01 · SchoolOS</span>
                </div>
              </div>
            </div>
            <form onSubmit={submitProfile(saveProfile)} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="set-name">Ism-familiya</Label>
                <Input id="set-name" {...regProfile("name")} />
                {profileErrors.name ? <p className="text-danger text-xs">{profileErrors.name.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-phone">Telefon</Label>
                <Input id="set-phone" {...regProfile("phone")} />
                {profileErrors.phone ? <p className="text-danger text-xs">{profileErrors.phone.message}</p> : null}
              </div>
              <Button type="submit" size="sm">
                Saqlash
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <Palette className="text-primary size-4.5" /> Tashqi ko‘rinish
            </CardTitle>
            <CardDescription>Yorug‘ yoki qorong‘i mavzu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: "light", label: "Yorug‘", icon: <Sun /> },
                  { key: "dark", label: "Qorong‘i", icon: <Moon /> },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  onClick={() => setTheme(o.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                    theme === o.key
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-foreground/25",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      o.key === "light" ? "bg-amber-100 text-amber-600" : "bg-slate-800 text-slate-200",
                    )}
                  >
                    {o.icon}
                  </span>
                  <span className="text-sm font-medium">{o.label}</span>
                </button>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="text-primary size-4" /> Bildirishnomalar
              </p>
              {(
                [
                  { key: "payments", label: "To‘lov olish va kechikishlar", desc: "Har bir operatsiya haqida" },
                  { key: "attendance", label: "Davomat ogohlantirishlari", desc: "Kechikkan va kelmaganlar" },
                  { key: "crm", label: "CRM yangilanishlari", desc: "Yangi lid va bosqich o‘zgarishlari" },
                  { key: "digest", label: "Kunlik xulosa", desc: "Har kuni 08:00 da" },
                ] as const
              ).map((n) => (
                <div key={n.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">{n.label}</p>
                    <p className="text-muted-foreground text-xs">{n.desc}</p>
                  </div>
                  <Switch
                    checked={notifs[n.key]}
                    onCheckedChange={(v) => setNotifs((s) => ({ ...s, [n.key]: v }))}
                    aria-label={n.label}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <ShieldCheck className="text-primary size-4.5" /> Xavfsizlik
            </CardTitle>
            <CardDescription>Parolni o‘zgartirish</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPass(savePassword)} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="set-cur">Joriy parol</Label>
                <Input id="set-cur" type="password" placeholder="••••••••" {...regPass("current")} />
                {passErrors.current ? <p className="text-danger text-xs">{passErrors.current.message}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="set-new">Yangi parol</Label>
                  <Input id="set-new" type="password" placeholder="Kamida 8 belgi" {...regPass("next")} />
                  {passErrors.next ? <p className="text-danger text-xs">{passErrors.next.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-conf">Takrorlash</Label>
                  <Input id="set-conf" type="password" placeholder="••••••••" {...regPass("confirm")} />
                  {passErrors.confirm ? <p className="text-danger text-xs">{passErrors.confirm.message}</p> : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm">
                  <KeyRound className="size-3.5" /> Parolni yangilash
                </Button>
                <span className="text-muted-foreground text-xs">Demo: real parol almashinmaydi</span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* School + data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <Building2 className="text-primary size-4.5" /> Maktab va ma'lumotlar
            </CardTitle>
            <CardDescription>Tashkiliy ma'lumotlar va demo rejimi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <InfoRow label="Maktab" value="SchoolOS — demo maktabi" />
              <InfoRow label="O‘quvchilar" value="1,248 ta (demo)" />
              <InfoRow label="Manzil" value="Toshkent sh., Chilonzor tumani" />
              <InfoRow label="Ish vaqti" value="08:00 – 18:00" />
            </div>
            <Separator />
            <div className="flex flex-col gap-3 rounded-2xl border border-danger/25 bg-danger/5 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger">Demo ma'lumotlarni qayta tiklash</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Barcha o‘zgarishlar (o‘quvchilar, to‘lovlar, CRM) boshlang‘ich holatga qaytadi.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
                <RotateCcw className="size-3.5" /> Qayta tiklash
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Demo ma'lumotlarini tiklash"
        description="Barcha kiritingan o‘zgarishlar o‘chiriladi va boshlang‘ich demo holatga qaytadi. Davom etasizmi?"
        confirmText="Ha, tiklash"
        destructive
        onConfirm={() => {
          resetDemo();
          setResetOpen(false);
          toast.success("Demo ma'lumotlar tiklandi");
        }}
      />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
