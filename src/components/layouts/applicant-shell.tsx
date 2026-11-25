"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ChevronDown, FileText, Folder, House, LogOut, Menu, Search, UserRound } from "lucide-react";
import { CrownMark } from "@/components/shared/crown-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api/browser";
import type { CandidateView } from "@/lib/data/demo-store";
import { cn } from "cn";

const links = [
  { href: "/applicant", label: "Dashboard", icon: House },
  { href: "/applicant/applications", label: "My Applications", icon: FileText },
  { href: "/applicant/profile", label: "My Profile", icon: UserRound },
  { href: "/applicant/documents", label: "My Documents", icon: Folder },
  { href: "/jobs", label: "Browse Jobs", icon: Search },
];

function isActive(pathname: string, href: string) {
  return href === "/applicant" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <CrownMark className="size-8 text-base" />
      <div>
        <p className="text-sm font-semibold text-primary">Crowne ORMS</p>
        <p className="text-xs text-muted-foreground">Applicant Portal</p>
      </div>
    </div>
  );
}

const itemClass = "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-foreground outline-none hover:bg-royal-soft focus-visible:ring-3 focus-visible:ring-ring/50";

function NavLinks({ pathname, onNavigate, onSignOut }: { pathname: string; onNavigate?: () => void; onSignOut: () => void }) {
  return (
    <nav aria-label="Applicant portal" className="px-3">
      <ul className="grid gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  itemClass,
                  active && "bg-royal-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-border pt-4">
        <button type="button" onClick={onSignOut} className={itemClass}>
          <LogOut className="size-[18px] shrink-0" />
          Log out
        </button>
      </div>
    </nav>
  );
}

export function ApplicantShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api<CandidateView | null>("/api/profile")).data,
  });
  const name = profile.data?.fullName?.trim() || "Account";

  async function signOut() {
    await api("/api/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
    <div className="min-h-screen bg-background md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card md:flex">
        <Brand />
        <NavLinks pathname={pathname} onSignOut={signOut} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-8">
          <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none hover:bg-royal-soft focus-visible:ring-3 focus-visible:ring-ring/50">
              <Avatar>
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="max-w-40 truncate text-sm font-medium">{name}</span>
              <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push("/applicant/profile")}>My Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="top-0 left-0 h-dvh w-[248px] max-w-[248px] translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-[248px]"
          showCloseButton
        >
          <DialogTitle className="sr-only">Applicant navigation</DialogTitle>
          <Brand />
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} onSignOut={signOut} />
        </DialogContent>
      </Dialog>
    </>
  );
}
