"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Briefcase, LayoutDashboard, Plane, Settings, Users, Wallet, ClipboardList, CircleDot } from "lucide-react";
import type { ReactNode } from "react";
import { CrownMark } from "@/components/shared/crown-mark";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { cn } from "cn";

const main = [
  { href: "/agency", label: "Overview", icon: LayoutDashboard },
  { href: "/agency/job-orders", label: "Job orders", icon: Briefcase },
  { href: "/agency/recruitment", label: "Recruitment", icon: CircleDot },
  { href: "/agency/candidates", label: "Candidates", icon: Users },
  { href: "/agency/processing", label: "Processing", icon: ClipboardList },
  { href: "/agency/deployment", label: "Deployment", icon: Plane },
];

const business = [
  { href: "/agency/finance", label: "Finance", icon: Wallet },
  { href: "/agency/reports", label: "Reports", icon: BarChart3 },
  { href: "/agency/settings", label: "Settings", icon: Settings },
];

export function AgencyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await api("/api/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[260px] shrink-0 flex-col bg-primary p-4 text-[#dce2ff] md:flex">
        <div className="mb-5 flex items-center gap-2.5 px-2 text-white">
          <CrownMark />
          <span>
            <strong className="block text-sm tracking-wide">CROWNE</strong>
            <small className="text-[9px] font-semibold tracking-[0.14em]">HUMAN RESOURCES, INC.</small>
          </span>
        </div>
        <div className="mb-5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs">
          <p className="font-semibold text-white">Agency workspace</p>
          <p className="mt-0.5 text-[#b8c2ef]">2018 Crowne Human Resources</p>
        </div>
        <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.14em] text-[#9ea9dc]">MAIN WORKSPACE</p>
        <nav className="grid gap-1">
          {main.map((item) => (
            <NavLink key={item.href} href={item.href} active={item.href === "/agency" ? pathname === item.href : pathname.startsWith(item.href)}>
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-5 px-3 pb-2 text-[10px] font-bold tracking-[0.14em] text-[#9ea9dc]">BUSINESS MANAGEMENT</p>
        <nav className="grid gap-1">
          {business.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={signOut} className="mt-auto rounded-lg px-3 py-2 text-left text-xs text-[#dce2ff] hover:bg-white/10">
          Sign out
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex gap-2 overflow-auto border-b border-border bg-card p-3 md:hidden">
          {[...main, ...business].map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 text-xs font-semibold text-primary">{item.label}</Link>
          ))}
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active ? "bg-card font-semibold text-primary shadow-xs" : "hover:bg-white/10",
      )}
    >
      {children}
    </Link>
  );
}

export function UnavailableButton({ label }: { label: string }) {
  return (
    <Button type="button" variant="outline" disabled title="This action is not available yet">
      {label}
    </Button>
  );
}
