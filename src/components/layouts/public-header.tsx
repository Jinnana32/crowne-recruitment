"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CrownMark } from "@/components/shared/crown-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { Actor } from "@/lib/auth/session";
import { cn } from "cn";

const links = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Find jobs" },
  { href: "/how-it-works", label: "How it works" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function PublicHeader() {
  const pathname = usePathname();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await api<Actor | null>("/api/session")).data,
    staleTime: 60_000,
  });
  const actor = session.data;
  const home = actor?.role === "staff" ? "/agency" : "/applicant";

  return (
    <header className="sticky top-0 z-20 border-b border-[#E8E6DF] bg-[#FBFBF8]/92 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-primary">
          <CrownMark />
          <span>
            <strong className="font-display block text-[15px] font-semibold tracking-wide">CROWNE</strong>
            <small className="block text-[9px] font-semibold tracking-[0.14em] text-muted-foreground">
              HUMAN RESOURCES, INC.
            </small>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-primary/70 sm:gap-5">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/jobs"
                  ? pathname === "/jobs" || pathname.startsWith("/jobs/")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative hidden py-1 sm:inline",
                  active ? "font-semibold text-primary" : "hover:text-primary",
                )}
              >
                {link.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gold" />
                ) : null}
              </Link>
            );
          })}
          {actor ? (
            <Link href={home} className="flex items-center gap-2 rounded-full px-1.5 py-1 text-foreground hover:bg-royal-soft">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(actor.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate sm:inline">{actor.name}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-full border-primary/15 px-4")}
              >
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants(), "h-9 rounded-full px-4")}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
