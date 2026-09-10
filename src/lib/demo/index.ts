import { generatePeople, type PeopleData } from "./people";
import { generateOperations, type OperationsData } from "./operations";
import { MONTHS_UZ } from "../utils";

export type DemoData = PeopleData & OperationsData;

export { MONTHS_UZ };

let cache: DemoData | null = null;

/** Deterministic demo dataset (seeded), built once per session. */
export function getDemoData(): DemoData {
  if (!cache) {
    const people = generatePeople();
    const operations = generateOperations(people);
    cache = { ...people, ...operations };
  }
  return cache;
}

/** Recreate the dataset (used by Settings → "Demo ma'lumotlarni qayta tiklash"). */
export function resetDemoData(): DemoData {
  cache = null;
  return getDemoData();
}
