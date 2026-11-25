export type DataSource = "demo" | "supabase";

export function getDataSource(): DataSource {
  const explicit = process.env.DATA_SOURCE;

  if (explicit === "demo") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATA_SOURCE=demo is not available in production.");
    }
    return "demo";
  }

  if (explicit === "supabase") return "supabase";

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) return "supabase";
  if (process.env.NODE_ENV === "production") return "supabase";
  return "demo";
}
