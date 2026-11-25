import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decodeDemoSession, DEMO_COOKIE } from "@/lib/auth/demo-session";
import { crowneTables } from "@/lib/supabase/tables";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsApplicant = path.startsWith("/applicant");
  const needsStaff = path.startsWith("/agency");
  if (!needsApplicant && !needsStaff) return NextResponse.next();

  const hasSupabase =
    process.env.DATA_SOURCE === "supabase" ||
    (process.env.DATA_SOURCE !== "demo" &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

  if (!hasSupabase && process.env.NODE_ENV !== "production") {
    const session = decodeDemoSession(request.cookies.get(DEMO_COOKIE)?.value);
    if (!session) return redirectToLogin(request, path);
    if (needsStaff && session.role !== "staff") {
      return NextResponse.redirect(new URL("/applicant", request.url));
    }
    if (needsApplicant && session.role !== "applicant") {
      return NextResponse.redirect(new URL("/agency", request.url));
    }
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return redirectToLogin(request, path);

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) return redirectToLogin(request, path);

  const { data: profile } = await supabase
    .from(crowneTables.profiles)
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  const role = profile?.role === "staff" ? "staff" : "applicant";
  if (needsStaff && role !== "staff") {
    return NextResponse.redirect(new URL("/applicant", request.url));
  }
  if (needsApplicant && role !== "applicant") {
    return NextResponse.redirect(new URL("/agency", request.url));
  }
  return response;
}

function redirectToLogin(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/applicant/:path*", "/agency/:path*"],
};
