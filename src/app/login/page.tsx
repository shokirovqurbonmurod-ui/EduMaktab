"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  MailQuestion,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo, LogoMark } from "@/components/layout/Logo";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DEMO_ACCOUNTS,
  demoUserFor,
  normalizePhone,
  ROLE_LABELS,
  verifyDemoPassword,
} from "@/lib/auth";

const phoneRe = /^(\+?998|998)?\d{9}$/;

const schema = z
  .object({
    phone: z
      .string()
      .min(1, "Telefon raqamini kiriting")
      .refine((v) => phoneRe.test(v.replace(/\s/g, "")), "Telefon raqami noto‘g‘ri. Namuna: +998 90 000 00 01"),
    password: z.string().min(6, "Parol kamida 6 belgidan iborat bo‘lsin"),
  })
  .transform((d) => ({ ...d, phone: normalizePhone(d.phone.replace(/\s/g, "")) }));

type FormData = z.infer<typeof schema>;

const FEATURES = [
  {
    icon: <GraduationCap />,
    title: "To‘liq o‘quv jarayoni",
    text: "O‘quvchilar, davomat, baholar, imtihonlar va jadval — bitta panelda.",
  },
  {
    icon: <BadgeCheck />,
    title: "Moliya nazorati",
    text: "To‘lovlar, xarajatlar, maoshlar va hisobotlar real vaqtda.",
  },
  {
    icon: <Sparkles />,
    title: "SchoolOS AI",
    text: "Davomat, natijalar va daromadlarni bir so‘rovda tahlil qiladi.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const session = useAuthStore((s) => s.session);
  const [showPass, setShowPass] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [forgotSent, setForgotSent] = React.useState(false);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) router.replace("/app/dashboard");
  }, [session, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setChecking(true);
    const account = DEMO_ACCOUNTS.find((a) => a.phone === data.phone);
    const okPass = await verifyDemoPassword(data.password);
    if (!account || !okPass) {
      setChecking(false);
      toast.error("Kirishda xatolik", {
        description: "Telefon raqami yoki parol noto‘g‘ri. Demo hisoblardan birini sinab ko‘ring.",
      });
      return;
    }
    login(demoUserFor(account), remember);
    toast.success(`Xush kelibsiz, ${demoUserFor(account).name}!`, {
      description: `${ROLE_LABELS[account.role]} profili bilan kirildi.`,
    });
    router.push("/app/dashboard");
  };

  const fillDemo = (i: number) => {
    const acc = DEMO_ACCOUNTS[i]!;
    setValue("phone", acc.phone, { shouldValidate: false });
    setValue("password", "Demo123!", { shouldValidate: false });
    passRef.current?.focus();
  };

  return (
    <div className="app-glow flex min-h-dvh">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <div className="brand-gradient pointer-events-none absolute -top-32 -left-32 size-[480px] rounded-full opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-[420px] rounded-full bg-primary/10 blur-3xl" />

        <Logo />

        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl leading-[1.12] font-bold tracking-tight xl:text-[44px]">
              Xususiy maktabingizni
              <br />
              <span className="text-gradient">bitta tizimda</span> boshqaring
            </h1>
            <p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
              SchoolOS — xususiy maktab boshqaruvining yangi avlodi. O‘quv jarayoni, moliya va
              ota-onalar aloqasini zamonaviy, tezkor va shaffof qiling.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 rounded-2xl border bg-card/60 p-4 backdrop-blur-sm transition-all hover:border-primary/30"
              >
                <span className="brand-gradient-soft flex size-10 shrink-0 items-center justify-center rounded-xl text-primary [&_svg]:size-5">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-[13px] leading-snug">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground relative flex items-center gap-2 text-xs">
          <ShieldCheck className="size-4" />
          Demo rejim · Ma‘lumotlar lokal saqlanadi · v2.4.0
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <LogoMark className="size-12" />
            <div>
              <p className="text-xl font-bold">
                School<span className="text-gradient">OS</span>
              </p>
              <p className="text-muted-foreground text-sm">Xususiy maktab boshqaruvining yangi avlodi</p>
            </div>
          </div>

          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold tracking-tight">Tizimga kirish</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Davom etish uchun telefon raqamingiz va parolingizni kiriting
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqami</Label>
                <div className="relative">
                  <Phone className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+998 90 000 00 01"
                    className="h-12 pl-10"
                    {...register("phone")}
                  />
                </div>
                {errors.phone ? (
                  <p className="text-danger text-xs font-medium" role="alert">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Parol</Label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 pr-11 pl-10"
                    {...register("password")}
                    ref={passRef}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 transition-colors"
                    aria-label={showPass ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-danger text-xs font-medium" role="alert">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    aria-label="Meni eslab qolish"
                  />
                  Meni eslab qolish
                </label>
                <span className="text-muted-foreground text-xs">Demo rejim</span>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={checking}
              >
                {checking ? (
                  <>
                    <Loader2 className="animate-spin" /> Tekshirilmoqda…
                  </>
                ) : (
                  <>
                    Kirish <ArrowRight />
                  </>
                )}
              </Button>
            </form>

            <Separator className="my-7">
              <span className="text-muted-foreground text-xs">Demo hisoblar</span>
            </Separator>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a, i) => (
                <button
                  key={a.phone}
                  type="button"
                  onClick={() => fillDemo(i)}
                  className="group flex items-center gap-2.5 rounded-2xl border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ background: `hsl(${a.hue} 65% 55%)` }}
                  >
                    {ROLE_LABELS[a.role].slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13px] font-semibold">{ROLE_LABELS[a.role]}</span>
                    <span className="text-muted-foreground num block truncate text-[11px]">+998 90 000 00 0{i + 1}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-center text-xs">
              <KeyRound className="size-3.5" />
              Barcha demo parollar: <span className="num font-semibold">Demo123!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={(o) => { setForgotOpen(o); if (!o) setForgotSent(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailQuestion className="size-5 text-primary" />
              Parolni tiklash
            </DialogTitle>
            <DialogDescription>
              Telefon raqamingizni kiriting — sizga parolni tiklash havolasi yuboriladi.
            </DialogDescription>
          </DialogHeader>
          <ForgotForm onDone={() => setForgotSent(true)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              Yopish
            </Button>
            {forgotSent ? (
              <Button onClick={() => setForgotOpen(false)}>Tayyor</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ForgotForm({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Input
        type="tel"
        placeholder="+998 90 000 00 01"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setErr(null);
        }}
        aria-label="Telefon raqam (parol tiklash)"
      />
      {err ? <p className="text-danger text-xs">{err}</p> : null}
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          const clean = normalizePhone(phone.replace(/\s/g, ""));
          if (!clean.startsWith("998") || clean.length !== 13) {
            setErr("To‘g‘ri telefon raqamini kiriting");
            return;
          }
          onDone();
          toast.success("Havola yuborildi", {
            description: "Demo rejim: xabar yuborilgani hisoblanadi.",
          });
        }}
      >
        Havolani yuborish
      </Button>
    </div>
  );
}
