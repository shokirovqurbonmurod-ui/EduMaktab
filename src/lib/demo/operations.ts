import type {
  AppNotification,
  AttendanceRecord,
  CalendarEvent,
  CashFlowPoint,
  Expense,
  Exam,
  Grade,
  GradeType,
  Homework,
  Invoice,
  KpiRecord,
  Lead,
  Message,
  Payment,
  Salary,
  User,
} from "../types";
import { Rng } from "./rng";
import { addDaysISO, todayISO } from "../utils";
import type { PeopleData } from "./people";

export interface OperationsData {
  attendance: AttendanceRecord[];
  grades: Grade[];
  homework: Homework[];
  exams: Exam[];
  payments: Payment[];
  invoices: Invoice[];
  expenses: Expense[];
  salaries: Salary[];
  cashFlow: CashFlowPoint[];
  leads: Lead[];
  notifications: AppNotification[];
  messages: Message[];
  calendar: CalendarEvent[];
  kpis: KpiRecord[];
  staff: User[];
}

const GRADE_TYPES: GradeType[] = ["homework", "test", "exam", "participation"];

export function generateOperations(people: PeopleData, seed = 987654321): OperationsData {
  const rng = new Rng(seed);
  const today = todayISO();
  const coreStudents = people.students.filter((s) => s.groupId.startsWith("cls"));
  const coreClasses = people.classes.filter((c) => c.type === "class");
  const subjectTeachersOf = (classId: string, subjectId: string): string => {
    const cls = people.classes.find((c) => c.id === classId)!;
    const slot = cls.schedule.find((sl) => sl.subjectId === subjectId);
    return slot?.teacherId ?? cls.teacherId;
  };

  /* ---------- attendance ---------- */
  const attendance: AttendanceRecord[] = [];
  let attSeq = 0;
  const pushAtt = (studentId: string, date: string, status: AttendanceRecord["status"], method: AttendanceRecord["method"], time?: string) => {
    attSeq++;
    attendance.push({ id: `att_${attSeq}`, studentId, date, status, time, method });
  };

  // history: last 14 days (Mon-Sat), core students
  const historyDays: string[] = [];
  for (let d = 1; d <= 20 && historyDays.length < 14; d++) {
    const iso = addDaysISO(today, -d);
    const wd = new Date(iso + "T12:00:00").getDay(); // 0 Sun .. 6 Sat
    if (wd !== 0) historyDays.push(iso);
  }
  for (const date of historyDays) {
    for (const s of coreStudents) {
      const r = rng.next();
      const status = r < 0.9 ? "present" : r < 0.95 ? "late" : r < 0.985 ? "absent" : "excused";
      pushAtt(s.id, date, status, rng.chance(0.7) ? "face" : rng.chance(0.5) ? "qr" : "manual");
    }
  }

  // today: every student
  for (const s of people.students) {
    const r = rng.next();
    const status: AttendanceRecord["status"] =
      s.id === "stu_core_0001" ? "present" : r < 0.88 ? "present" : r < 0.93 ? "late" : r < 0.975 ? "absent" : "excused";
    const time =
      status === "late" ? `08:${rng.int(35, 59)}` : status === "present" ? `08:${rng.int(5, 28)}` : undefined;
    const method: AttendanceRecord["method"] =
      s.groupId.startsWith("cls") ? (rng.chance(0.72) ? "face" : rng.chance(0.5) ? "qr" : "manual") : "manual";
    pushAtt(s.id, today, status, method, time);
  }

  /* ---------- grades ---------- */
  const grades: Grade[] = [];
  let grSeq = 0;
  const coreSubjectIds = ["sub_en", "sub_math", "sub_uz", "sub_phys", "sub_chem", "sub_bio", "sub_inf"];
  for (const s of coreStudents) {
    for (const subId of coreSubjectIds) {
      const n = rng.int(4, 6);
      for (let k = 0; k < n; k++) {
        grSeq++;
        const value = Math.min(10, Math.max(3, Math.round(rng.gauss(s.avgGrade, 1.1))));
        grades.push({
          id: `gr_${grSeq}`,
          studentId: s.id,
          subjectId: subId,
          type: rng.pick(GRADE_TYPES),
          value,
          date: addDaysISO(today, -rng.int(1, 30)),
          teacherId: subjectTeachersOf(s.groupId, subId),
        });
      }
    }
  }
  // boost the demo student
  const demoStudentId = "stu_core_0001";
  const demo = people.students.find((s) => s.id === demoStudentId);
  if (demo) {
    demo.avgGrade = 9.2;
    demo.attendanceRate = 98;
    demo.paymentStatus = "paid";
  }
  for (const g of grades) if (g.studentId === demoStudentId) g.value = Math.min(10, g.value + 1);

  /* ---------- homework ---------- */
  const homework: Homework[] = [];
  const hwSubjects = ["sub_en", "sub_math", "sub_phys", "sub_inf", "sub_chem", "sub_uz"];
  for (let h = 0; h < 18; h++) {
    const cls = rng.pick(coreClasses);
    const subId = rng.pick(hwSubjects);
    const teacherId = subjectTeachersOf(cls.id, subId);
    const total = cls.studentCount;
    const submitted = Math.round(total * rng.gauss(0.82, 0.1));
    const subs = rng
      .shuffle(coreStudents.filter((s) => s.groupId === cls.id))
      .slice(0, Math.min(10, submitted))
      .map((s) => ({
        studentId: s.id,
        submittedAt: addDaysISO(today, -rng.int(0, 5)),
        grade: rng.chance(0.6) ? rng.int(6, 10) : undefined,
        comment: rng.chance(0.2) ? "Yaxshi bajarilgan" : undefined,
      }));
    const subj = people.subjects.find((x) => x.id === subId)!;
    homework.push({
      id: `hw_${h + 1}`,
      title: `${subj.name} — ${rng.pick(["Mavzu bo'yicha vazifa", "Kontrollik test", "Dars 12 bo'yicha", "Loyiha ishi", "Amaliyot", "Takrorlov vazifasi"])} ${h + 1}`,
      subjectId: subId,
      classId: cls.id,
      teacherId,
      description: "O'quvchilarga vazifa topshiriqlari yuborildi. Bajarilganlarni tekshirish kerak.",
      dueDate: addDaysISO(today, rng.int(-2, 7)),
      createdAt: addDaysISO(today, -rng.int(3, 12)),
      fileName: rng.chance(0.6) ? `vazifa_${h + 1}.pdf` : undefined,
      totalStudents: total,
      submittedCount: Math.min(submitted, total),
      submissions: subs,
      status: rng.pick(["open", "grading", "closed"]),
    });
  }

  /* ---------- exams ---------- */
  const exams: Exam[] = [];
  const examDefs = [
    { title: "Matematika — I yarim yillik nazorat", sub: "sub_math", cls: "cls_9a", past: true },
    { title: "Ingliz tili — Speaking imtihoni", sub: "sub_en", cls: "cls_10a", past: true },
    { title: "Fizika — Kontrollik imtihon", sub: "sub_phys", cls: "cls_11a", past: true },
    { title: "Kimyo — II chorak test", sub: "sub_chem", cls: "cls_8a", past: true },
    { title: "Ona tili — Diktant va tahlil", sub: "sub_uz", cls: "cls_7a", past: true },
    { title: "Informatika — Loyiha himoyasi", sub: "sub_inf", cls: "cls_9a", past: true },
    { title: "Matematika — olimpiada tayyorlov", sub: "sub_math", cls: "cls_11a", past: false },
    { title: "Ingliz tili — C1 tayyorlov test", sub: "sub_en", cls: "cls_11a", past: false },
    { title: "Biologiya — nazorat ishi", sub: "sub_bio", cls: "cls_10a", past: false },
    { title: "Fizika — amaliyot imtihoni", sub: "sub_phys", cls: "cls_10a", past: false },
  ];
  examDefs.forEach((d, i) => {
    const cls = people.classes.find((c) => c.id === d.cls)!;
    const members = coreStudents.filter((s) => s.groupId === cls.id);
    const results = d.past
      ? members
          .map((s) => ({ studentId: s.id, score: Math.round(rng.gauss(78, 12)), rank: 0 }))
          .sort((a, b) => b.score - a.score)
          .map((r, idx) => ({ ...r, score: Math.min(100, Math.max(35, r.score)), rank: idx + 1 }))
      : [];
    exams.push({
      id: `ex_${i + 1}`,
      title: d.title,
      subjectId: d.sub,
      classId: cls.id,
      teacherId: subjectTeachersOf(cls.id, d.sub),
      date: d.past ? addDaysISO(today, -rng.int(2, 25)) : addDaysISO(today, rng.int(2, 20)),
      durationMin: rng.pick([45, 60, 90, 120]),
      questionCount: rng.pick([15, 20, 25, 30]),
      maxScore: 100,
      status: d.past ? "finished" : "scheduled",
      results,
    });
  });

  /* ---------- finance ---------- */
  const payments: Payment[] = [];
  const invoices: Invoice[] = [];
  let paySeq = 0;
  let invSeq = 0;
  const months = [
    { key: addDaysISO(today, -60).slice(0, 7) },
    { key: addDaysISO(today, -30).slice(0, 7) },
    { key: today.slice(0, 7) },
  ];
  months.forEach((m, mi) => {
    for (const s of people.students) {
      const cls = people.classes.find((c) => c.id === s.groupId)!;
      if (mi < 2) {
        if (!rng.chance(0.95)) continue;
        paySeq++;
        payments.push({
          id: `pay_${paySeq}`,
          studentId: s.id,
          amount: cls.monthlyPayment,
          date: `${m.key}-${String(rng.int(1, 28)).padStart(2, "0")}`,
          month: m.key,
          method: rng.pick(["cash", "card", "bank"]),
          status: "paid",
        });
        continue;
      }
      // current month
      paySeq++;
      const status = s.paymentStatus;
      const amount = status === "paid" ? cls.monthlyPayment : status === "partial" ? Math.round(cls.monthlyPayment / 2) : cls.monthlyPayment;
      payments.push({
        id: `pay_${paySeq}`,
        studentId: s.id,
        amount,
        date: today,
        month: m.key,
        method: rng.pick(["cash", "card", "bank"]),
        status,
        note: status === "debt" ? "To'lov kutilmoqda" : status === "partial" ? "Qismlab to'landi" : undefined,
      });
      invSeq++;
      invoices.push({
        id: `inv_${invSeq}`,
        number: `INV-${m.key.replace("-", "")}-${String(invSeq).padStart(4, "0")}`,
        studentId: s.id,
        amount: cls.monthlyPayment,
        issuedAt: `${m.key}-01`,
        dueDate: `${m.key}-05`,
        status: status === "paid" ? "paid" : status === "partial" ? "partial" : "overdue",
      });
    }
  });

  const expenses: Expense[] = [];
  const expCats: { cat: Expense["category"]; label: string; min: number; max: number; freq: number }[] = [
    { cat: "rent", label: "Binoyi ijarasi", min: 145_000_000, max: 155_000_000, freq: 1 },
    { cat: "utilities", label: "Yorug'lik, suv, isitish", min: 32_000_000, max: 48_000_000, freq: 1 },
    { cat: "food", label: "Oshxona va taomlar", min: 75_000_000, max: 95_000_000, freq: 2 },
    { cat: "materials", label: "O'quv materiallari", min: 8_000_000, max: 24_000_000, freq: 4 },
    { cat: "repairs", label: "Ta'mirlash va nazorat", min: 4_000_000, max: 18_000_000, freq: 3 },
    { cat: "transport", label: "Transport xarajatlari", min: 5_000_000, max: 12_000_000, freq: 3 },
    { cat: "marketing", label: "Reklama va tadbirlar", min: 6_000_000, max: 15_000_000, freq: 2 },
    { cat: "other", label: "Boshqa xarajatlar", min: 2_000_000, max: 9_000_000, freq: 5 },
  ];
  let expSeq = 0;
  for (let d = 0; d < 90; d++) {
    for (const c of expCats) {
      if (!rng.chance(1 / c.freq + 0.12)) continue;
      expSeq++;
      const date = addDaysISO(today, -d);
      expenses.push({
        id: `exp_${expSeq}`,
        title: c.label,
        category: c.cat,
        amount: rng.int(c.min, c.max),
        date,
        paidBy: rng.pick(["Baxtiyor Toshev", "Gulnora Saidova", "Shahzoda Alimov"]),
        method: rng.pick(["cash", "card", "bank"]),
      });
    }
  }

  const salaries: Salary[] = [];
  let salSeq = 0;
  months.forEach((m, mi) => {
    for (const t of people.teachers) {
      salSeq++;
      const base = t.monthlySalary;
      const bonus = t.kpiScore >= 85 ? Math.round(base * rng.gauss(0.08, 0.02)) : Math.round(base * rng.gauss(0.03, 0.01));
      const deduction = rng.chance(0.15) ? Math.round(base * 0.03) : 0;
      salaries.push({
        id: `sal_${salSeq}`,
        teacherId: t.id,
        month: m.key,
        base,
        bonus,
        deduction,
        total: base + bonus - deduction,
        status: mi < 2 ? "paid" : rng.chance(0.4) ? "approved" : "pending",
        paidAt: mi < 2 ? `${m.key}-28` : undefined,
      });
    }
  });

  const cashFlow: CashFlowPoint[] = [];
  const flowRng = new Rng(555777);
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const [y, mo] = key.split("-").map(Number);
    const label = `${mo === 9 ? "Sen" : mo === 10 ? "Okt" : mo === 11 ? "Noy" : mo === 12 ? "Dek" : mo === 1 ? "Yan" : mo === 2 ? "Fev" : mo === 3 ? "Mar" : mo === 4 ? "Apr" : mo === 5 ? "May" : mo === 6 ? "Iyn" : "Iyl"} ${String(y).slice(2)}`;
    const revenue = Math.round(flowRng.gauss(1_080_000_000, 45_000_000));
    const expensesVal = Math.round(flowRng.gauss(700_000_000, 30_000_000));
    cashFlow.push({ month: label, revenue, expenses: expensesVal, profit: revenue - expensesVal });
  }

  /* ---------- CRM ---------- */
  const staff: User[] = [
    { id: "usr_director", name: "Dilshod Karimov", phone: "+998 90 000 00 01", role: "DIRECTOR", avatarHue: 258, schoolId: "sch_01", createdAt: "2024-09-01" },
    { id: "usr_admin", name: "Kamola Azizova", phone: "+998 91 111 22 33", role: "ADMIN", avatarHue: 288, schoolId: "sch_01", createdAt: "2024-09-01" },
    { id: "usr_reception", name: "Shahzoda Alimov", phone: "+998 93 333 44 55", role: "RECEPTION", avatarHue: 152, schoolId: "sch_01", createdAt: "2025-02-01" },
    { id: "usr_accountant", name: "Gulnora Saidova", phone: "+998 99 555 66 77", role: "ACCOUNTANT", avatarHue: 200, schoolId: "sch_01", createdAt: "2025-05-01" },
  ];
  const leads: Lead[] = [];
  const leadNames: [string, string][] = [
    ["Jasur", "Toshpo'latov"], ["Malika", "Ismoilova"], ["Temur", "Rahmonov"], ["Nilufar", "Qodirova"],
    ["Sardor", "Mirzayev"], ["Zarina", "Abdullayeva"], ["Otabek", "Xolmatov"], ["Laylo", "Sattorova"],
    ["Bekzod", "Nazarov"], ["Dilnoza", "Sobirova"], ["Islom", "Berdiyev"], ["Gulnora", "Yusupova"],
    ["Kamron", "Tursunov"], ["Safi", "Karimova"], ["Yusuf", "Aliyev"], ["Parizoda", "Sharipova"],
    ["Ulug'bek", "Navruzov"], ["Munisa", "Davronova"], ["Shohruh", "Islomov"], ["Jannat", "Mahmudova"],
    ["Ravshan", "Saidov"], ["Rayhona", "Ganiyeva"], ["Mirjalol", "Anvarov"], ["Umida", "Fayzullayeva"],
  ];
  const stages: Lead["stage"][] = ["new", "contacted", "demo", "trial", "contract", "accepted", "rejected"];
  leadNames.forEach(([first, last], i) => {
    leads.push({
      id: `lead_${i + 1}`,
      name: first,
      parentName: last,
      phone: `+998 ${rng.pick(["90", "91", "93", "99"])} ${rng.int(100, 999)} ${rng.int(100, 999)} ${rng.int(100, 999)}`,
      course: rng.pick([
        "Umumiy o'qish (1-A)", "Ingliz tili B1", "Ingliz tili B2", "Matematika olimpiada",
        "Kimyo laboratoriya", "Informatika (Python)", "Robototexnika", "Suzish",
        "Musiqa (piano)", "Shaxmat", "Rangtasvir", "Dasturlash (Web)",
      ]),
      source: rng.pick(["telegram", "instagram", "referral", "site", "walkin", "other"]),
      stage: stages[Math.floor(rng.next() * stages.length)],
      managerId: rng.pick(staff).id,
      nextFollowUp: addDaysISO(today, rng.int(0, 10)),
      value: rng.int(45, 120) * 10_000,
      note: rng.chance(0.4) ? "Ota-onasi demo darsga qiziqish bildirdi." : undefined,
      createdAt: addDaysISO(today, -rng.int(0, 45)),
    });
  });

  /* ---------- notifications ---------- */
  const notifications: AppNotification[] = [
    { id: "ntf_1", type: "attendance", title: "Kechikkan o'quvchi", body: "Ali bugun 1-darsga 12 daqiqa kechikdi.", date: today, read: false, actorName: "9-A sinf" },
    { id: "ntf_2", type: "academic", title: "Natijalar oshdi", body: "9-A guruhining o'rtacha natijasi 8% ga oshdi.", date: today, read: false },
    { id: "ntf_3", type: "finance", title: "To'lov kechikkan", body: "3 ta o'quvchining to'lovi kechikkan. Ro'yxatni ko'ring.", date: today, read: false },
    { id: "ntf_4", type: "event", title: "Yig'ilish eslatmasi", body: "Bugun 14:00 da direktorlar yig'ilishi bo'lib o'tadi.", date: today, read: true },
    { id: "ntf_5", type: "system", title: "Tizim yangilandi", body: "SchoolOS 2.4.0 yangilanishi o'rnatildi.", date: today, read: true },
    { id: "ntf_6", type: "attendance", title: "Davomat yechilishda", body: "7-A sinfi uchun yuz orqali davomat 99.1% aniqlikda ishlayapti.", date: today, read: false },
    { id: "ntf_7", type: "finance", title: "Katta to'lov keldi", body: "11-A sinfi yillik to'lovining 250 mln so'mi tushdi.", date: addDaysISO(today, -1), read: true },
    { id: "ntf_8", type: "academic", title: "Yangi sertifikat", body: "Aziz Rahimov xalqaro olimpiada ishtirokchisi bo'ldi.", date: addDaysISO(today, -1), read: false },
    { id: "ntf_9", type: "event", title: "Ota-onalar uchrashuvi", body: "Ertaga 18:00 da 9-A ota-onalari bilan uchrashuv.", date: addDaysISO(today, -1), read: true },
    { id: "ntf_10", type: "system", title: "Zaxira nusxa", body: "Bugungi ma'lumotlar zaxira nusxasi muvaffaqiyatli yaratildi.", date: addDaysISO(today, -1), read: true },
    { id: "ntf_11", type: "finance", title: "Qarzdorlik hisoboti", body: "Oy oxiriga 42 mln so'm qarzdorlik qoldi (o'tgan oyga nisbatan 6% kam).", date: addDaysISO(today, -2), read: true },
    { id: "ntf_12", type: "academic", title: "Imtihon natijalari", body: "Ingliz tili Speaking imtihoni natijalari e'lon qilindi.", date: addDaysISO(today, -2), read: true },
  ];

  /* ---------- messages ---------- */
  const messages: Message[] = [];
  let msgSeq = 0;
  const pushMsg = (channel: Message["channel"], channelId: string, senderId: string, senderName: string, senderRole: User["role"], text: string, minAgo: number) => {
    msgSeq++;
    const d = new Date();
    d.setMinutes(d.getMinutes() - minAgo);
    messages.push({
      id: `msg_${msgSeq}`,
      channel,
      channelId,
      senderId,
      senderName,
      senderRole,
      text,
      sentAt: d.toISOString(),
    });
  };

  pushMsg("director", "directorate", "usr_director", "Dilshod Karimov", "DIRECTOR", "Assalomu alaykum! Oylik hisobotni bugun tushgacha tayyorlang.", 320);
  pushMsg("director", "directorate", "usr_accountant", "Gulnora Saidova", "ACCOUNTANT", "Rahmat, direktor. Tushgacha yetkazaman, qarzdorlik bo'yicha ustunliq berdim.", 305);
  pushMsg("director", "directorate", "usr_director", "Dilshod Karimov", "DIRECTOR", "Zo'r. Shuningdek yangi guruh ochish bo'yicha rejani ham qo'shing.", 298);
  pushMsg("director", "directorate", "usr_admin", "Kamola Azizova", "ADMIN", "CRM da 6 ta yangi lid bor, ular bilan bugun bog'lanamiz.", 240);
  pushMsg("director", "directorate", "usr_director", "Dilshod Karimov", "DIRECTOR", "Zo'r, ayniqsa olimpiada tayyorlov kursiga qiziqayotganlarni birinchi bo'lib qo'llab-quvvatlang.", 236);

  pushMsg("teachers", "teacher-chat", "tch_01", "Madina Yusupova", "TEACHER", "Kolleqalar, 9-A da ingliz tili imtihoni e'lon qilindi — 20 daqiqa oldindan materiallarni topshiring.", 450);
  pushMsg("teachers", "teacher-chat", "tch_05", "Eldor Toshpo'latov", "TEACHER", "Rahmat, Madina opa. Matematika bo'yicha ham shu tarzda qilamiz.", 430);
  pushMsg("teachers", "teacher-chat", "tch_12", "Feruza Ismoilova", "TEACHER", "Yangi o'quv materiallari omborga qo'shildi, 2-slaboda.", 380);
  pushMsg("teachers", "teacher-chat", "tch_01", "Madina Yusupova", "TEACHER", "Ajoyib! Shu haftaning yakuniy davomat hisobotini ham shu yerda ulashing.", 372);
  pushMsg("teachers", "teacher-chat", "tch_21", "Temur G'aniyev", "TEACHER", "Fizika amaliyoti uchun yangi laboratoriya jihozlariga ruxsat berildi 🎉", 180);

  pushMsg("parents", "par_00001", "par_00001", "Nodira Rahimova", "PARENT", "Assalomu alaykum, Azizning bugungi davomati qanday?", 210);
  pushMsg("parents", "par_00001", "tch_01", "Madina Yusupova", "TEACHER", "Va alaykum assalom! Aziz bugun barcha darslarga vaqtida keldi, ingliz tilida 9 ball oldi.", 200);
  pushMsg("parents", "par_00001", "par_00001", "Nodira Rahimova", "PARENT", "Rahmat! Ertaga uy vazifasi bor edi, bajarib berdim.", 150);
  pushMsg("parents", "par_00001", "tch_01", "Madina Yusupova", "TEACHER", "Albatta, homishni ko'rib chiqaman. Keyingi haftadagi ota-onalar uchrashuviga kutamiz.", 120);

  pushMsg("groups", "cls_9a", "tch_01", "Madina Yusupova", "TEACHER", "9-A guruhiga: shanba kuni 10:00 da Ingliz tili klub bo'yicha ko'ngilli dars bor.", 90);
  pushMsg("groups", "cls_9a", "stu_core_0002", "Bekzod Azimov", "STUDENT", "Rahmat, o'qituvchi! Vaqt va joy to'g'rimi?", 75);
  pushMsg("groups", "cls_9a", "tch_01", "Madina Yusupova", "TEACHER", "Ha, 305-xona. Barcha o'quvchilar kutilmoqda 😊", 60);

  /* ---------- calendar ---------- */
  const calendar: CalendarEvent[] = [
    { id: "cal_1", title: "Bilim bayrami tadbiri", date: today, time: "10:00", endTime: "13:00", type: "event", location: "Asosiy auditoriya", hue: 258 },
    { id: "cal_2", title: "Ota-onalar uchrashuvi (9-A)", date: addDaysISO(today, 1), time: "18:00", endTime: "19:30", type: "parent-meeting", location: "305-xona", hue: 152 },
    { id: "cal_3", title: "O'qituvchilar pedsoveti", date: addDaysISO(today, 3), time: "16:00", endTime: "17:30", type: "meeting", location: "Ma'muriy xona", hue: 200 },
    { id: "cal_4", title: "To'lov muddati", date: addDaysISO(today, 5), type: "payment", allDay: true, hue: 24 },
    { id: "cal_5", title: "Matematika — olimpiada tayyorlov", date: addDaysISO(today, 6), time: "09:00", endTime: "11:00", type: "exam", location: "401-xona", hue: 262 },
    { id: "cal_6", title: "Sport kunlari", date: addDaysISO(today, 8), time: "09:00", endTime: "14:00", type: "event", location: "Sport zali", hue: 40 },
    { id: "cal_7", title: "Mustaqillik kuniga bag'ishlab tadbir", date: addDaysISO(today, 11), time: "11:00", endTime: "13:00", type: "holiday", hue: 120 },
    { id: "cal_8", title: "Ingliz tili — C1 tayyorlov test", date: addDaysISO(today, 9), time: "10:00", endTime: "12:00", type: "exam", location: "308-xona", hue: 262 },
    { id: "cal_9", title: "Yangi o'quv oyligi boshlandi", date: addDaysISO(today, 20), type: "event", allDay: true, hue: 258 },
    { id: "cal_10", title: "Ota-onalar yig'ilishi (barcha sinflar)", date: addDaysISO(today, 14), time: "17:30", endTime: "19:00", type: "parent-meeting", location: "Asosiy auditoriya", hue: 152 },
    { id: "cal_11", title: "Biologiya — nazorat ishi", date: addDaysISO(today, 13), time: "09:30", endTime: "11:00", type: "exam", location: "204-xona", hue: 120 },
    { id: "cal_12", title: "To'lov muddati", date: addDaysISO(today, 25), type: "payment", allDay: true, hue: 24 },
    { id: "cal_13", title: "Ilmiy-amaliy konferensiya", date: addDaysISO(today, 18), time: "10:00", endTime: "16:00", type: "event", location: "Asosiy auditoriya", hue: 200 },
  ];

  /* ---------- KPI ---------- */
  const kpis: KpiRecord[] = people.teachers.map((t) => {
    const k = new Rng(Number(t.id.split("_")[1]) * 7 + 3);
    const vals = [
      Math.round(k.gauss(94, 4)),
      Math.round(k.gauss(84, 9)),
      Math.round(k.gauss(88, 6)),
      Math.round(k.gauss(86, 7)),
      Math.round(k.gauss(82, 8)),
      Math.round(k.gauss(87, 6)),
    ].map((v) => Math.min(100, Math.max(55, v)));
    const total = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return {
      teacherId: t.id,
      attendance: vals[0],
      progress: vals[1],
      homework: vals[2],
      satisfaction: vals[3],
      exams: vals[4],
      lessonQuality: vals[5],
      total: t.id === "tch_01" ? 92 : total,
      trend: k.int(-8, 10),
    };
  });

  return {
    attendance,
    grades,
    homework,
    exams,
    payments,
    invoices,
    expenses,
    salaries,
    cashFlow,
    leads,
    notifications,
    messages,
    calendar,
    kpis,
    staff,
  };
}
