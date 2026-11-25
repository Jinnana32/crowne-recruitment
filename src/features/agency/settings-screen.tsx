import { PageHeader } from "@/components/shared/page-header";

const proposedRoles = [
  "Super Admin",
  "Admin",
  "Recruitment Staff",
  "Processing Staff",
  "Deployment Staff",
  "Finance Staff",
  "Accounting Staff",
  "Management",
  "Candidate",
];

export function SettingsScreen() {
  return (
    <div>
      <PageHeader kicker="Administration" title="Settings" description="Role editing is unavailable until Crowne confirms the permission model." />
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Proposed roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">These names are a starting point from the security notes. They are not an approved access matrix.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {proposedRoles.map((role) => (
            <li key={role} className="rounded-lg bg-secondary px-3 py-2 text-sm">{role}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
