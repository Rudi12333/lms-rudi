export type RawSearchParams = Record<string, string | string[] | undefined>;

export type SearchParams = Promise<RawSearchParams>;

/** Ambil satu nilai string dari searchParams, aman dari string[] . */
export function pick(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}
