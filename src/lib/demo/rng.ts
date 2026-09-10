/** Deterministic PRNG (mulberry32) — demo data is stable across SSR/CSR. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private r: () => number;
  constructor(seed: number) {
    this.r = mulberry32(seed);
  }
  next(): number {
    return this.r();
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.r() * (max - min + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.r() * arr.length)];
  }
  chance(p: number): boolean {
    return this.r() < p;
  }
  /** Normal-ish distribution around mean */
  gauss(mean: number, spread: number): number {
    const u = this.r() + this.r() + this.r() - 1.5;
    return mean + u * spread;
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
