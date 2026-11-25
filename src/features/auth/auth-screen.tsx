"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { CrownMark } from "@/components/shared/crown-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/browser";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await api<{ role?: "applicant" | "staff"; confirmationRequired?: boolean }>("/api/session", {
        method: "POST",
        body: JSON.stringify({ mode, email, name, password }),
      });
      if (result.data.confirmationRequired) {
        toast.success("Account created. Confirm the email, then sign in.");
        router.push("/login");
        return;
      }
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : result.data.role === "staff" ? "/agency" : "/applicant");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-7">
        <div className="mb-5 flex items-center gap-2 text-primary">
          <CrownMark className="size-8" />
          <strong className="text-xs tracking-wide">CROWNE</strong>
        </div>
        <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your applicant account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Applicants and agency staff sign in with the account Crowne created. The account role comes from the profile, not this form."
            : "Create an applicant account to apply and follow your applications."}
        </p>
        {mode === "register" ? (
          <div className="mt-5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required className="mt-1 h-10" />
          </div>
        ) : null}
        <div className="mt-3">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 h-10" />
        </div>
        <div className="mt-3">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="mt-1 h-10" />
        </div>
        <Button type="submit" className="mt-5 w-full" disabled={pending}>{pending ? "Signing in…" : mode === "login" ? "Log in" : "Create account"}</Button>
        {mode === "login" ? (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-primary"
            onClick={() => toast("Password recovery waits for Crowne to confirm the recovery policy.")}
          >
            Forgot password?
          </button>
        ) : null}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? <Link href="/register" className="font-semibold text-primary">Create an account</Link> : <Link href="/login" className="font-semibold text-primary">Log in</Link>}
        </p>
      </form>
    </div>
  );
}
