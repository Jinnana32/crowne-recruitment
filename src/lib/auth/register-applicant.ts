import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crowneTables } from "@/lib/supabase/tables";
import type { SupabaseClient } from "@supabase/supabase-js";

function reference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `CND-${day}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function insertApplicant(db: SupabaseClient, userId: string, input: { name: string; email: string }) {
  const { error: profileError } = await db.from(crowneTables.profiles).insert({
    id: userId,
    full_name: input.name,
    email: input.email,
    role: "applicant",
  });
  if (profileError && profileError.code !== "23505") {
    throw new Error(profileError.message);
  }

  const { data: existing } = await db.from(crowneTables.candidates).select("id").eq("profile_id", userId).maybeSingle();
  if (existing) return;

  const { error: candidateError } = await db.from(crowneTables.candidates).insert({
    profile_id: userId,
    reference: reference(),
    full_name: input.name,
    email: input.email,
    status: "Active",
    source: "Agency portal",
  });
  if (candidateError && candidateError.code !== "23505") {
    throw new Error(candidateError.message);
  }
}

export async function registerApplicant(input: { name: string; email: string; password: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.name } },
  });
  if (error?.message.toLowerCase().includes("already")) {
    const signedIn = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (signedIn.error || !signedIn.data.user) {
      throw new Error("An account with this email already exists. Sign in instead.");
    }
    await insertApplicant(supabase, signedIn.data.user.id, input);
    return { confirmationRequired: false as const };
  }
  if (error || !data.user) {
    throw new Error(error?.message ?? "The account could not be created.");
  }

  if (data.session) {
    await insertApplicant(supabase, data.user.id, input);
    return { confirmationRequired: false as const };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Confirm the email address, then sign in. The profile could not be prepared.");
  }
  await insertApplicant(admin, data.user.id, input);
  return { confirmationRequired: true as const };
}
