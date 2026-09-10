export const MALE_NAMES = [
  "Aziz", "Bekzod", "Bobur", "Doston", "Dilshod", "Elyor", "Eldor", "Farrux", "Hasan", "Islom",
  "Jasur", "Javlon", "Kamron", "Mirsaid", "Nodir", "Otabek", "Qahramon", "Qodir", "Raxim", "Sadiq",
  "Sardor", "Shohruh", "Temur", "Ulug'bek", "Usmon", "Xurshid", "Yakub", "Yusuf", "Zafar", "Abror",
  "Azizbek", "Bekmurod", "Davron", "Diyorbek", "Feruza", "G'ani", "Humoyun", "Javohir", "Kahramon", "Lutulla",
  "Malik", "Mukhammad", "Norzila", "Otajon", "Pardas", "Ravshan", "Samandar", "Shavkat", "To'lqin", "Tulkin",
  "Umid", "Vafo", "Vohid", "Ziyorat", "Eshon", "Firdavs", "G'alib", "Hikmat", "Ibrohim", "Juma",
] as const;

export const FEMALE_NAMES = [
  "Aziza", "Bahor", "Dilnoza", "Feruza", "Gulnora", "Hodiza", "Iroda", "Javohir", "Kamola", "Laylo",
  "Madina", "Nilufar", "Oydin", "Parizoda", "Ravza", "Safi", "Shaxnoza", "Zarina", "Zulfiya", "Abrora",
  "Bahoda", "Dilfaroz", "Fathima", "Gulkhurmuz", "Humoyra", "Jannat", "Khatija", "Malika", "Munisa", "Nigora",
  "Orzu", "Pervin", "Rayhona", "Samira", "Tursunoy", "Umida", "Xurshida", "Yosura", "Ziyoda", "Abrorakhon",
  "Boboakbar", "Dildora", "Feruza", "Gulchehra", "Hakim", "Ilyosona", "Jasmina", "Kamranisa", "Lolabegim", "Madani",
  "Nasiba", "Ozoda", "Pari", "Roza", "Sabina", "Tahmina", "Ulfat", "Xayrullo", "Yulduz", "Zabida",
] as const;

export const SURNAMES = [
  "Abdullayev", "Abduvaliyev", "Akbarov", "Aliyev", "Anvarov", "Azimov", "Baratov", "Berdiyev", "Boboyev", "Choriyev",
  "Davronov", "Ergashev", "Fayzullayev", "Ganiyev", "Haydarov", "Islomov", "Kamolov", "Karimov", "Khasanov", "Kholmatov",
  "Lutfullayev", "Mahmudov", "Mirzayev", "Navruzov", "Nazarov", "Norboyev", "Rahimov", "Rizaev", "Saidov", "Salimov",
  "Sharipov", "Sobirov", "Sodiqov", "Toshev", "Tursunov", "Umarov", "Usmonov", "Valiyev", "Xudoyberdiyev", "Yunusov",
] as const;

export function surnameFor(base: string, female: boolean): string {
  return female ? base + "a" : base;
}

export const CLUB_NAMES = [
  "Ingliz tili A2", "Ingliz tili B1", "Ingliz tili B2", "Ingliz tili C1", "Rus tili B1", "German tili A2",
  "Matematika olimpiada", "Matematika +", "Kimyo laboratoriya", "Fizika olimpiada", "Biologiya klub",
  "Informatika 1", "Informatika 2", "Robototexnika", "Dasturlash (Python)", "Dasturlash (Web)", "IT Startap",
  "Dizayn (UI/UX)", "Shaxmat", "Suzish", "Futbol", "Basketbol", "Voleybol", "Judo", "Yengil atletika",
  "Boks", "Badminton", "Olimpiada tayyorlov", "Notoq sünati", "Ijodiy yozuv", "Ilmiy tadqiqot",
  "Musiqa (piano)", "Musiqa (guitar)", "Rangtasvir", "Raqs (klasik)", "Raqs (zamonaviy)", "Qo'lda ishlash",
  "Tennis", "Filmoniy klub", "Siyosiy ilmiy klub", "Iqtisodiyot klub",
  "Xorijiy til klub", "Kitobxona klub", "Astronomiya", "Geologiya klub",
] as const;

export const OCCUPATIONS = [
  "Tadbirkor", "Shifokor", "O'qituvchi", "Injener", "Muhassir", "Hukumat xodimi", "Advokat", "Sotuvchi",
  "Nazorchisi", "IT mutaxassis", "Dorixona", "Muzaffar",
];

export const CITY_AREAS = [
  "Chilonzor 4-kvartal", "Yunusobod 12-kvartal", "Sergeli 6-kvartal", "Mirobod tumani",
  "Shayxontohur tumani", "Olmazor tumani", "Uchtepa tumani", "Yashnobod tumani",
  "Bektemir tumani", "Qibray tumani",
];

export const SUBJECT_COURSE_NAMES = [
  "Umumiy o'qish", "Ingliz tili", "Matematika", "Fizika", "Kimyo", "Biologiya",
  "Informatika", "Robototexnika", "Shaxmat", "Suzish", "Futbol", "Musiqa",
  "Rangtasvir", "Raqs", "Dasturlash", "Dizayn", "Notoq sünati", "Olimpiada tayyorlov",
];
