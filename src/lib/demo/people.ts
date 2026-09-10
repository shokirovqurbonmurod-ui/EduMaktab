import type {
  Parent,
  SchoolClass,
  ScheduleSlot,
  Student,
  Subject,
  Teacher,
  Certificate,
} from "../types";
import { Rng } from "./rng";
import {
  MALE_NAMES,
  FEMALE_NAMES,
  SURNAMES,
  CLUB_NAMES,
  CITY_AREAS,
  surnameFor,
} from "./names";

/* ---------------------------------- */
/* Subjects                           */
/* ---------------------------------- */

export const SUBJECTS: Subject[] = [
  { id: "sub_en", name: "Ingliz tili", shortName: "ING", hue: 24 },
  { id: "sub_math", name: "Matematika", shortName: "MAT", hue: 262 },
  { id: "sub_uz", name: "Ona tili", shortName: "ONA", hue: 152 },
  { id: "sub_phys", name: "Fizika", shortName: "FIZ", hue: 210 },
  { id: "sub_chem", name: "Kimyo", shortName: "KIM", hue: 288 },
  { id: "sub_bio", name: "Biologiya", shortName: "BIO", hue: 120 },
  { id: "sub_inf", name: "Informatika", shortName: "INF", hue: 190 },
  { id: "sub_hist", name: "Tarix", shortName: "TAR", hue: 40 },
  { id: "sub_geo", name: "Geografiya", shortName: "GEO", hue: 95 },
  { id: "sub_social", name: "Ijtimoiy fan", shortName: "IJT", hue: 330 },
  { id: "sub_sport", name: "Sport", shortName: "SPT", hue: 8 },
  { id: "sub_art", name: "San'at", shortName: "SAN", hue: 300 },
];

export const CORE_CLASS_DEFS = [
  { name: "9-A", room: "305" },
  { name: "1-A", room: "101" },
  { name: "2-A", room: "102" },
  { name: "3-A", room: "103" },
  { name: "5-A", room: "201" },
  { name: "7-A", room: "204" },
  { name: "8-A", room: "301" },
  { name: "10-A", room: "308" },
  { name: "11-A", room: "401" },
] as const;

const DAY_SUBJECTS: Record<number, string[]> = {
  0: ["sub_math", "sub_uz", "sub_en", "sub_phys", "sub_bio", "sub_hist"],
  1: ["sub_en", "sub_math", "sub_uz", "sub_inf", "sub_chem", "sub_geo"],
  2: ["sub_math", "sub_phys", "sub_en", "sub_social", "sub_art", "sub_uz"],
  3: ["sub_bio", "sub_chem", "sub_math", "sub_en", "sub_hist", "sub_sport"],
  4: ["sub_uz", "sub_inf", "sub_math", "sub_geo", "sub_phys", "sub_en"],
  5: ["sub_en", "sub_sport", "sub_math", "sub_uz"],
};

const SLOT_TIMES = ["08:30", "09:30", "10:30", "11:30", "13:00", "14:00"];

function endTime(start: string): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + 40;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export interface PeopleData {
  subjects: Subject[];
  classes: SchoolClass[];
  teachers: Teacher[];
  parents: Parent[];
  students: Student[];
}

const CERT_POOL: Omit<Certificate, "id" | "date">[] = [
  { title: "Xalqaro olimpiada ishtirokchisi", issuer: "Olimpiada qo'mitasi" },
  { title: "Shahar bosqichi 2-o'rin", issuer: "Shahar ta'lim boshqarmasi" },
  { title: "Maktab bo'yicha g'olib", issuer: "Ziyo Academy" },
  { title: "Matematika festivali 1-o'rin", issuer: "Respublika markazi" },
  { title: "Ingliz tili o'yini g'olibi", issuer: "British Council" },
  { title: "Sport musobaqasi 3-o'rin", issuer: "Yoshlar sport kengashi" },
  { title: "Ijodiy loyihalar ko'rgazmasi", issuer: "Ziyo Academy" },
];

export function generatePeople(seed = 20260910): PeopleData {
  const rng = new Rng(seed);

  /* ---------- teachers (86) ---------- */
  const teachers: Teacher[] = [];
  const subjectPool = [
    "sub_en", "sub_math", "sub_uz", "sub_phys", "sub_chem", "sub_bio", "sub_inf",
    "sub_hist", "sub_geo", "sub_social", "sub_sport", "sub_art",
  ];
  const huePool = [258, 152, 24, 200, 288, 120, 190, 40, 330, 8, 95, 300];

  // tch_01 — demo teacher (fixed identity)
  teachers.push({
    id: "tch_01",
    firstName: "Madina",
    lastName: "Yusupova",
    middleName: "Rustam qizi",
    gender: "female",
    subjectId: "sub_en",
    phone: "+998 90 000 00 02",
    email: "m.yusupova@ziyo.uz",
    hireDate: "2022-09-01",
    status: "active",
    groupsIds: [],
    monthlySalary: 5_200_000,
    kpiScore: 92,
    rating: 4.9,
    attendanceRate: 99,
    hue: 152,
  });

  for (let i = 2; i <= 86; i++) {
    const gender = rng.chance(0.55) ? "male" : "female";
    const first = gender === "male" ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
    const last = surnameFor(rng.pick(SURNAMES), gender === "female");
    const subjectId = rng.pick(subjectPool);
    const op = rng.pick(["90", "88", "93", "99"]);
    const phone = `+998 ${op} ${rng.int(100, 999)} ${rng.int(100, 999)} ${rng.int(100, 999)}`;
    teachers.push({
      id: `tch_${String(i).padStart(2, "0")}`,
      firstName: first,
      lastName: last,
      middleName: rng.chance(0.4) ? `${rng.pick(MALE_NAMES)} o'g'li` : undefined,
      gender,
      subjectId,
      phone,
      email: `${first[0].toLowerCase()}.${last.toLowerCase()}@ziyo.uz`,
      hireDate: `${rng.int(2018, 2026)}-${String(rng.int(1, 9)).padStart(2, "0")}-01`,
      status: rng.chance(0.05) ? "vacation" : "active",
      groupsIds: [],
      monthlySalary: rng.int(350, 750) * 10_000,
      kpiScore: Math.round(rng.gauss(85, 8)),
      rating: Math.round(rng.gauss(4.4, 0.35) * 10) / 10,
      attendanceRate: Math.round(rng.gauss(96, 2.5)),
      hue: huePool[i % huePool.length],
    });
    teachers[teachers.length - 1].kpiScore = Math.min(99, Math.max(62, teachers[teachers.length - 1].kpiScore));
    teachers[teachers.length - 1].rating = Math.min(5, Math.max(3.6, teachers[teachers.length - 1].rating));
  }

  /* ---------- core classes + homeroom teachers ---------- */
  const coreTeachers = teachers.slice(1, 10); // tch_02..tch_09
  const clubLeaders = teachers.slice(10, 55); // tch_11..tch_54
  const subjectTeachers = teachers.slice(55); // tch_56..tch_86

  const classes: SchoolClass[] = [];
  const coreCounts: Record<string, number> = {};
  let coreSum = 0;
  for (const def of CORE_CLASS_DEFS) {
    const count = def.name === "9-A" ? 24 : rng.int(22, 28);
    coreCounts[def.name] = count;
    coreSum += count;
  }

  /* ---------- clubs (45) sized so total students = exactly 1248 ---------- */
  const TARGET = 1248;
  const clubsRemaining = TARGET - coreSum;
  const clubBase = CLUB_NAMES.map((name) => ({ name, count: rng.int(16, 30) }));
  let clubSum = clubBase.reduce((s, c) => s + c.count, 0);
  // Adjust deterministically to hit the exact target
  let i = 0;
  while (clubSum !== clubsRemaining) {
    const c = clubBase[i % clubBase.length];
    if (clubSum < clubsRemaining) {
      if (c.count < 40) {
        c.count += 1;
        clubSum += 1;
      }
    } else {
      if (c.count > 10) {
        c.count -= 1;
        clubSum -= 1;
      }
    }
    i++;
    if (i > 100000) break;
  }

  /* ---------- parents ---------- */
  const parents: Parent[] = [];
  let parSeq = 0;
  function makeParent(gender: "male" | "female", lastNameBase?: string): Parent {
    parSeq++;
    const first = gender === "male" ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
    const last = surnameFor(lastNameBase ?? rng.pick(SURNAMES), gender === "female");
    return {
      id: parSeq < 10000 ? `par_${String(parSeq).padStart(5, "0")}` : `par_${parSeq}`,
      name: `${first} ${last}`,
      phone: `+998 ${rng.pick(["90", "88", "93", "99"])} ${rng.int(100, 999)} ${rng.int(100, 999)} ${rng.int(100, 999)}`,
      occupation: rng.pick([
        "Tadbirkor", "Shifokor", "O'qituvchi", "Injener", "Muharrir", "Davlat xodimi",
        "Advokat", "Savdo xodimi", "IT mutaxassis", "Buxgalter",
      ]),
      address: rng.pick(CITY_AREAS),
      childrenIds: [],
      hue: rng.int(0, 360),
      status: "active",
    };
  }

  /* ---------- students ---------- */
  const students: Student[] = [];
  const today = new Date();
  let coreSeq = 0;
  let clubSeq = 0;

  function makeStudent(
    groupId: string,
    gradeLevel: number,
    fixed?: { firstName: string; lastName: string; parentName: string },
  ): Student {
    const isCore = groupId.startsWith("cls");
    if (isCore) coreSeq++;
    else clubSeq++;
    const seq = isCore ? coreSeq : clubSeq;
    const gender: "male" | "female" = rng.chance(0.52) ? "male" : "female";
    const firstName = fixed?.firstName ?? (gender === "male" ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES));
    const lastNameBase = fixed?.lastName ?? rng.pick(SURNAMES);
    const lastName = surnameFor(lastNameBase, gender === "female");
    const age = gradeLevel + rng.int(5, 6);
    const birth = new Date(today.getFullYear() - age, rng.int(0, 11), rng.int(1, 28));
    const code = isCore
      ? `SM-${String(birth.getFullYear()).slice(2)}-${String(seq).padStart(4, "0")}K`
      : `SM-${String(birth.getFullYear()).slice(2)}-${String(seq).padStart(4, "0")}L`;

    // parents
    const pids: string[] = [];
    const mother = makeParent("female", lastNameBase);
    mother.name = fixed && fixed.parentName ? fixed.parentName : mother.name;
    pids.push(mother.id);
    parents.push(mother);
    if (rng.chance(0.55)) {
      const father = makeParent("male", lastNameBase);
      pids.push(father.id);
      parents.push(father);
    }
    pids.forEach((pid) => {
      parents.find((p) => p.id === pid)!.childrenIds.push(""); // placeholder, filled after id
    });

    const paymentStatus: Student["paymentStatus"] = rng.chance(0.78) ? "paid" : rng.chance(0.55) ? "partial" : "debt";
    const certs: Certificate[] = [];
    const nCerts = rng.chance(0.35) ? rng.int(1, 3) : 0;
    for (let c = 0; c < nCerts; c++) {
      const base = rng.pick(CERT_POOL);
      certs.push({
        id: `cert_${students.length}_${c}`,
        title: base.title,
        date: `${rng.int(2025, 2026)}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}`,
        issuer: base.issuer,
      });
    }

    const student: Student = {
      id: isCore ? `stu_core_${String(seq).padStart(4, "0")}` : `stu_club_${String(seq).padStart(4, "0")}`,
      code,
      firstName,
      lastName,
      gender,
      birthDate: `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, "0")}-${String(birth.getDate()).padStart(2, "0")}`,
      groupId,
      parentIds: pids,
      phone: rng.chance(0.25) ? `+998 9${rng.int(0, 9)} ${rng.int(100, 999)} ${rng.int(100, 999)} ${rng.int(100, 999)}` : undefined,
      address: rng.chance(0.6) ? rng.pick(CITY_AREAS) : undefined,
      status: rng.chance(0.97) ? "active" : "inactive",
      joinDate: `${rng.int(2023, 2026)}-09-01`,
      attendanceRate: Math.min(100, Math.round(rng.gauss(94, 3.5))),
      avgGrade: Math.round(Math.min(10, Math.max(4.5, rng.gauss(8.1, 0.9))) * 10) / 10,
      paymentStatus,
      hue: rng.int(0, 360),
      behaviorScore: Math.round(Math.min(100, Math.max(55, rng.gauss(90, 7)))),
      certificates: certs,
    };
    // fix parent children ids
    pids.forEach((pid) => {
      const p = parents.find((pp) => pp.id === pid)!;
      const idx = p.childrenIds.indexOf("");
      if (idx >= 0) p.childrenIds[idx] = student.id;
    });
    students.push(student);
    return student;
  }

  // 9-A first — demo student is its first pupil
  makeStudent("cls_9a", 9, { firstName: "Aziz", lastName: "Rahimov", parentName: "Nodira Rahimova" });
  const demoParent = parents[0];
  demoParent.id = "par_00001";

  for (const def of CORE_CLASS_DEFS) {
    const clsId = `cls_${def.name.toLowerCase().replace("-", "")}`;
    const count = def.name === "9-A" ? coreCounts["9-A"] - 1 : coreCounts[def.name];
    const gradeLevel = Number(def.name.split("-")[0]);
    for (let s = 0; s < count; s++) makeStudent(clsId, gradeLevel);
  }

  // re-link demo student parent
  const demoStudent = students.find((s) => s.firstName === "Aziz" && s.lastName === "Rahimov");
  if (demoStudent) {
    demoStudent.id = "stu_core_0001";
    demoStudent.parentIds = ["par_00001"];
    demoParent.childrenIds = [demoStudent.id];
    demoParent.occupation = "Tadbirkor";
    // give the demo family a second child in 7-A
    const sibling = makeStudent("cls_7a", 7);
    const orphan = parents.find((p) => p.id !== "par_00001" && p.childrenIds.includes(sibling.id));
    if (orphan) orphan.childrenIds = orphan.childrenIds.filter((id) => id !== sibling.id);
    sibling.parentIds = ["par_00001"];
    demoParent.childrenIds = [demoStudent.id, sibling.id];
  }

  // demo teacher (tch_01, Madina Yusupova) teaches English in the top grades
  teachers[0].groupsIds = ["cls_9a", "cls_10a", "cls_11a"];

  // clubs
  clubBase.forEach((c, idx) => {
    const clsId = `club_${String(idx + 1).padStart(2, "0")}`;
    const gradeLevel = rng.int(3, 11);
    for (let s = 0; s < c.count; s++) makeStudent(clsId, gradeLevel);
  });

  // safety: trim or note if over/under target
  while (students.length > TARGET) students.pop();

  /* ---------- assemble classes ---------- */
  const countByGroup: Record<string, number> = {};
  const attByGroup: Record<string, number[]> = {};
  students.forEach((s) => {
    countByGroup[s.groupId] = (countByGroup[s.groupId] ?? 0) + 1;
    (attByGroup[s.groupId] ??= []).push(s.attendanceRate);
  });

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);

  const coreClassHues = [258, 24, 152, 200, 288, 120, 190, 40, 330];
  CORE_CLASS_DEFS.forEach((def, idx) => {
    const clsId = `cls_${def.name.toLowerCase().replace("-", "")}`;
    const homeroom = coreTeachers[idx];
    homeroom.groupsIds.push(clsId);
    const schedule: ScheduleSlot[] = [];
    for (let day = 0; day <= 5; day++) {
      const subjects = DAY_SUBJECTS[day];
      subjects.forEach((subId, slot) => {
        const subjectTeachersForSub = subjectTeachers.filter((t) => t.subjectId === subId);
        let t: Teacher;
        if (subjectTeachersForSub.length > 0) {
          t = subjectTeachersForSub[idx % subjectTeachersForSub.length];
        } else {
          t = rng.pick(subjectTeachers);
        }
        t.groupsIds = [...new Set([...t.groupsIds, clsId])];
        schedule.push({
          day,
          start: SLOT_TIMES[slot],
          end: endTime(SLOT_TIMES[slot]),
          subjectId: subId,
          teacherId: t.id,
          room: def.room,
        });
      });
    }
    const list = attByGroup[clsId] ?? [94];
    classes.push({
      id: clsId,
      name: def.name,
      type: "class",
      teacherId: homeroom.id,
      studentCount: countByGroup[clsId] ?? 0,
      room: def.room,
      attendanceRate: Math.round(avg(list)),
      avgResult: Math.round(rng.gauss(84, 6)),
      monthlyPayment: 1_100_000 + Number(def.name.split("-")[0]) * 15_000,
      hue: coreClassHues[idx],
      schedule,
      description: `${def.name} sinf — asosiy o'quv guruhi`,
    });
  });

  // Madina (tch_01) leads English in 9-A / 10-A / 11-A
  for (const cls of classes) {
    if (cls.id === "cls_9a" || cls.id === "cls_10a" || cls.id === "cls_11a") {
      for (const slot of cls.schedule) {
        if (slot.subjectId === "sub_en") slot.teacherId = "tch_01";
      }
    }
  }

  clubBase.forEach((c, idx) => {
    const clsId = `club_${String(idx + 1).padStart(2, "0")}`;
    const leader = clubLeaders[idx];
    leader.groupsIds.push(clsId);
    const leaderSubject = SUBJECTS.find((s) => c.name.startsWith(s.name.split(" ")[0])) ?? null;
    const schedule: ScheduleSlot[] = [
      { day: 1, start: "16:00", end: "17:30", subjectId: leaderSubject?.id ?? leader.subjectId, teacherId: leader.id, room: `G${idx + 1}` },
      { day: 3, start: "16:00", end: "17:30", subjectId: leaderSubject?.id ?? leader.subjectId, teacherId: leader.id, room: `G${idx + 1}` },
    ];
    const list = attByGroup[clsId] ?? [93];
    classes.push({
      id: clsId,
      name: c.name,
      type: "club",
      teacherId: leader.id,
      studentCount: countByGroup[clsId] ?? 0,
      room: `G${idx + 1}`,
      attendanceRate: Math.round(avg(list)),
      avgResult: Math.round(rng.gauss(82, 8)),
      monthlyPayment: rng.int(40, 90) * 10_000,
      hue: (idx * 47) % 360,
      schedule,
      description: `${c.name} qo'shimcha guruh`,
    });
  });

  return { subjects: SUBJECTS, classes, teachers, parents, students };
}
