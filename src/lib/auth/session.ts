import { cookies } from "next/headers";
import { DEMO_COOKIE, decodeDemoSession, type SessionRole } from "@/lib/auth/demo-session";
import { getDataSource } from "@/lib/data/source";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crowneTables } from "@/lib/supabase/tables";

export type Actor = {
  source: "demo" | "supabase";
  role: SessionRole;
  name: string;
  email: string;
  candidateId: string | null;
  userId: string | null;
};

export async function getSession(): Promise<Actor | null> {
  if (getDataSource() === "demo") {
    const cookieStore = await cookies();
    const session = decodeDemoSession(cookieStore.get(DEMO_COOKIE)?.value);
    if (!session) return null;
    return { source: "demo", userId: null, ...session };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from(crowneTables.profiles)
    .select("full_name, email, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role === "staff" ? "staff" : "applicant";
  let candidateId: string | null = null;
  if (role === "applicant") {
    const { data: candidate } = await supabase
      .from(crowneTables.candidates)
      .select("id")
      .eq("profile_id", data.user.id)
      .maybeSingle();
    candidateId = candidate?.id ?? null;
  }

  return {
    source: "supabase",
    role,
    name: profile?.full_name ?? data.user.email ?? "Account",
    email: profile?.email ?? data.user.email ?? "",
    candidateId,
    userId: data.user.id,
  };
}
