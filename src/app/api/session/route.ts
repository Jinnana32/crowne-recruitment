import { cookies } from "next/headers";
import { DEMO_COOKIE, encodeDemoSession } from "@/lib/auth/demo-session";
import { getSession } from "@/lib/auth/session";
import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { ensureDemoCandidate } from "@/lib/data/repository";
import { getDataSource } from "@/lib/data/source";
import { registerApplicant } from "@/lib/auth/register-applicant";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sessionSchema } from "@/lib/validation/api";

const demoApplicant = {
  role: "applicant" as const,
  name: "Maria Santos",
  email: "maria.santos@email.com",
  candidateId: "cand-maria",
};

const demoStaff = {
  role: "staff" as const,
  name: "Maria Cruz",
  email: "maria.cruz@crowne.example",
  candidateId: null,
};

export async function GET() {
  const session = await getSession();
  return jsonData(session);
}

export async function POST(request: Request) {
  const parsed = sessionSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(422, "invalid_session", "Enter a valid email and a password of at least 8 characters.");
  }

  if (getDataSource() === "demo") {
    const name = parsed.data.name ?? parsed.data.email;
    const candidate = parsed.data.role === "staff"
      ? null
      : await ensureDemoCandidate({ fullName: name, email: parsed.data.email });
    const session = parsed.data.role === "staff"
      ? { ...demoStaff, name, email: parsed.data.email }
      : {
          role: "applicant" as const,
          name: candidate?.fullName ?? name,
          email: candidate?.email ?? parsed.data.email,
          candidateId: candidate?.id ?? demoApplicant.candidateId,
        };
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, encodeDemoSession(session), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return jsonData({ ...session, source: "demo" satisfies "demo" });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return jsonError(503, "supabase_unconfigured", "Add the Supabase URL and anon key before signing in.");
  }
  if (!parsed.data.password) {
    return jsonError(422, "password_required", "Enter a password of at least 8 characters.");
  }

  if (parsed.data.mode === "register") {
    if (!parsed.data.name) return jsonError(422, "invalid_session", "Enter the applicant's full name.");
    try {
      const created = await registerApplicant({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (created.confirmationRequired) {
        return jsonData({ confirmationRequired: true, role: "applicant" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The account could not be created.";
      return jsonError(400, "registration_failed", message);
    }
    const session = await getSession();
    return jsonData(session);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    const unconfirmed = error.message.toLowerCase().includes("confirm");
    return jsonError(
      401,
      unconfirmed ? "email_unconfirmed" : "invalid_credentials",
      unconfirmed ? "Confirm the email address, then sign in." : "The email or password was not accepted.",
    );
  }
  const session = await getSession();
  if (!session) return jsonError(403, "profile_missing", "This account has no Crowne profile.");
  return jsonData(session);
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  return jsonData({ signedOut: true });
}
