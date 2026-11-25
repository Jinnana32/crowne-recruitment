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
  { href: "/#how", label: "How it works" },
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
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 text-primary">
          <CrownMark />
          <span>
            <strong className="block text-sm tracking-wide">CROWNE</strong>
            <small className="block text-[9px] font-semibold tracking-[0.14em] text-muted-foreground">
              HUMAN RESOURCES, INC.
            </small>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "hidden sm:inline",
                pathname === link.href && "font-semibold text-primary underline decoration-2 underline-offset-8",
              )}
            >
              {link.label}
            </Link>
          ))}
          {actor ? (
            <Link href={home} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-foreground hover:bg-royal-soft">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(actor.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate sm:inline">{actor.name}</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Log in
              </Link>
              <Link href="/register" className={buttonVariants()}>Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
