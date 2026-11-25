import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/http";

export async function requireSession(role?: "staff" | "applicant") {
  const session = await getSession();
  if (!session) {
    return { session: null, response: jsonError(401, "unauthenticated", "Sign in to continue.") };
  }
  if (role && session.role !== role) {
    return {
      session,
      response: jsonError(403, "forbidden", "You do not have access to this action."),
    };
  }
  return { session, response: null };
}
