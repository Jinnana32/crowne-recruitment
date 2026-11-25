import { ApplicantShell } from "@/components/layouts/applicant-shell";

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  return <ApplicantShell>{children}</ApplicantShell>;
}
