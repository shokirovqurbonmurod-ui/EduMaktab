# SchoolOS

**Xususiy maktabingizni bitta tizimda boshqaring.**

SchoolOS — o‘zbekistonlik xususiy maktablar uchun ishlab chiqilgan premium ERP tizimi:
o‘quvchilar, guruhlar, davomat, baholar, jadval, uy vazifalar, imtihonlar, moliya
(to‘lovlar, xarajatlar, maoshlar), CRM (qabul jarayoni), ota-onalar bilan aloqa,
bildirishnomalar, analitika, KPI va AI yordamchi — hammasi bitta interfeysda.

> Xususiy maktab boshqaruvining yangi avlodi.

---

## Demo hisoblar

Parol barcha rollar uchun: **`Demo123!`**

| Rol | Telefon | Kuzatuv |
| --- | --- | --- |
| Direktor | `+998 90 000 00 01` | To‘liq (dashboard, moliya, CRM, KPI, AI) |
| O‘qituvchi | `+998 90 000 00 02` | O‘z guruhlari, baholar, uy vazifalar |
| O‘quvchi | `+998 90 000 00 03` | O‘z baholari, jadvali, vazifalari |
| Ota-ona | `+998 90 000 00 04` | Farzand holati, to‘lovlar, xabarlar |

Boshqa rollar (ADMIN, ACCOUNTANT, RECEPTION) ham tizimda qo‘llab-quvvatlanadi.

## Imkoniyatlar

- **Dashboard** — KPI kartalari, maktabning jonli holati, tez amallar
- **O‘quvchilar / O‘qituvchilar / Guruhlar** — qidiruv, filtrlar, CRUD, profil sahifalar
- **Davomat** — bugun/hafta/oy, QR va Face ID joylari, bitta tugma bilan belgilash
- **Jadval** — kun/hafta/oy ko‘rinishlari, har guruh bo‘yicha
- **Baholar, uy vazifalar, imtihonlar** — baho kitobi, topshiriqlarni baholash, natijalar
- **Moliya** — to‘lovlar (UZS), xarajatlar (kategoriyalar, diagrammalar), maoshlar
- **CRM** — sudrab-tashlash (drag & drop) pidlar: Yangi lid → Bog‘lanildi → Demo dars → Sinov → Shartnoma → Qabul/Red
- **Ota-onalar va Xabarlar** — iMessage-uslubidagi chatlar (javob avtomatik)
- **Analitika va KPI** — Recharts diagrammalari, davr filtrlari (Bugun/7 kun/30 kun/3 oy/1 yil), o‘qituvchilar radar-diagrammalari
- **Kalendar** — oylik tarmoq, tadbirlarni qo‘shish
- **SchoolOS AI** — jonli ma’lumotlar asosida javob beruvchi yordamchi (demo rejim)
- **Sozlamalar** — profil, yorug‘/qorong‘i mavzu, xavfsizlik, demo ma’lumotlarni tiklash

## Texnologiyalar

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS** — Apple/iOS uslubidagi dizayn (glassmorphism, gradientlar, micro-animations)
- **shadcn/ui** uslubidagi komponentlar, **Lucide** ikonkalar
- **Recharts** — barcha diagrammalar
- **React Hook Form + Zod** — form validatsiyasi
- **Zustand** — client-store (hamma kolleksiyalar backend jadvalari kabi tuzilgan)
- **PWA** — manifest, ikonkalar, to‘liq ekran rejimi
- To‘liq **responsiv** — iPhone 15/16/Pro Max uchun mobilli navigatsiya (pastki menyu + More sheet)
- **Qorong‘i / yorug‘** rejim

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda [http://localhost:3000](http://localhost:3000) ni oching va yuqoridagi
demo hisoblardan biri bilan kiring.

Ishlab chiqarish:

```bash
npm run build
npm start
```

## Ma’lumotlar tuzilmasi

Barcha ma’lumotlar hozircha **demo (client-side)** rejimda saqlanadi, lekin arxitektura
haqiqiy backendga oson ulanish uchun tayyor:

- `src/lib/types.ts` — har bir tizim obyekti uchun to‘liq tip: `User`, `Student`,
  `Parent`, `Teacher`, `SchoolClass`, `Subject`, `AttendanceRecord`, `Grade`,
  `Homework`, `Exam`, `Payment`, `Expense`, `Salary`, `Invoice`, `Lead`,
  `AppNotification`, `Message`, `CalendarEvent`, `KpiRecord`
- `src/stores/useDataStore.ts` — barcha mutatsiyalar (qo‘shish, o‘zgartirish,
  o‘chirish) alohida actionlar orqali o‘tadi; real API ulanganda faqat shu
  actionlar `fetch` chaqiruvlariga almashtiriladi — UI o‘zgarmaydi
- `src/lib/demo/` — deterministik demo ma’lumotlar generatori (seed bilan)
- `src/lib/analytics.ts` — hisoblashlar (tushum, davomat, KPI reytingi va h.k.)
- Autentifikatsiya: `src/lib/auth.ts` + `useAuthStore` — demo parollar SHA-256
  hash bilan tekshiriladi, sessiya localStorage/sessionStorage’da saqlanadi;
  JWT/NextAuth/Supabase bilan almashtirish uchun qulay

## Sahifalar

```
/login
/app/dashboard        /app/students        /app/teachers        /app/classes
/app/attendance       /app/schedule        /app/grades          /app/homework
/app/exams            /app/payments        /app/expenses        /app/salaries
/app/crm              /app/parents         /app/messages        /app/notifications
/app/analytics        /app/kpi             /app/calendar        /app/settings
/app/ai               /app/students/[id]   /app/teachers/[id]
```

## Litsenziya

Demo loyiha. Brend, logo va ma’lumotlar asl loyihalardan mustaqil yaratilgan.
