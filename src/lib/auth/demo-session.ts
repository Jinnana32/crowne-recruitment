export const DEMO_COOKIE = "crowne_demo_session";

export type SessionRole = "applicant" | "staff";

export type DemoSession = {
  role: SessionRole;
  name: string;
  email: string;
  candidateId: string | null;
};

export function encodeDemoSession(session: DemoSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeDemoSession(value: string | undefined | null): DemoSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<DemoSession>;
    if (parsed.role !== "applicant" && parsed.role !== "staff") return null;
    if (!parsed.email || !parsed.name) return null;
    return {
      role: parsed.role,
      name: parsed.name,
      email: parsed.email,
      candidateId: parsed.candidateId ?? null,
    };
  } catch {
    return null;
  }
}
