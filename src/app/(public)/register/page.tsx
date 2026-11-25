import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm">Loading registration…</p>}>
      <AuthScreen mode="register" />
    </Suspense>
  );
}
