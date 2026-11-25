import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm">Loading sign-in…</p>}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
