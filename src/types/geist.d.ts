// The `geist` package ships local next/font fonts. Its bundled .d.ts files
// are circular re-exports with no declared members, so we declare the
// runtime API here (verified against dist/font.js).

declare module "geist/font/sans" {
  export const GeistSans: {
    className?: string;
    variable: string;
    style: React.CSSProperties;
  };
}

declare module "geist/font/mono" {
  export const GeistMono: {
    className?: string;
    variable: string;
    style: React.CSSProperties;
  };
}
