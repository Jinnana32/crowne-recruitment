import { AgencyShell } from "@/components/layouts/agency-shell";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return <AgencyShell>{children}</AgencyShell>;
}
