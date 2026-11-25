import type { CandidateView } from "@/lib/data/demo-store";
import type { EducationEntry, WorkExperienceEntry } from "@/lib/data/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type CandidateCvData = {
  candidate: CandidateView;
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  const label = MONTHS[Number(month) - 1];
  return label && year ? `${label} ${year}` : value;
}

function formatPeriod(entry: { startMonth: string; endMonth: string; isCurrent: boolean }) {
  return `${formatMonth(entry.startMonth)} – ${entry.isCurrent ? "Present" : formatMonth(entry.endMonth)}`;
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function contactLine(candidate: CandidateView) {
  return [candidate.email, candidate.mobile, candidate.nationality || candidate.preferredDestination]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" | ");
}

function summary(candidate: CandidateView) {
  if (candidate.experience?.trim()) return lines(candidate.experience.trim());
  if (candidate.preferredRole?.trim()) {
    const destination = candidate.preferredDestination?.trim();
    return `<p>${escapeHtml(
      `${candidate.fullName} is interested in ${candidate.preferredRole}${destination ? ` roles in ${destination}` : ""}.`,
    )}</p>`;
  }
  return "";
}

function languages(candidate: CandidateView) {
  return candidate.languages
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Plain single-column HTML for ATS parsers and Puppeteer PDF rendering. */
export function renderAtsCvHtml(data: CandidateCvData) {
  const { candidate, workExperience, education } = data;
  const contact = contactLine(candidate);
  const summaryHtml = summary(candidate);
  const languageList = languages(candidate);

  const workHtml =
    workExperience.length === 0
      ? "<p>No work experience recorded.</p>"
      : workExperience
          .map((entry) => {
            const meta = [entry.employerName, entry.country].filter(Boolean).join(" · ");
            return `<section class="job">
  <h3>${escapeHtml(entry.jobTitle)}</h3>
  <p class="meta">${escapeHtml(meta)}</p>
  <p class="meta">${escapeHtml(formatPeriod(entry))}</p>
  ${entry.description.trim() ? lines(entry.description.trim()) : ""}
</section>`;
          })
          .join("");

  const educationHtml =
    education.length > 0
      ? education
          .map((entry) => {
            const meta = [entry.school, entry.fieldOfStudy].filter(Boolean).join(" · ");
            return `<section class="school">
  <h3>${escapeHtml(entry.qualification)}</h3>
  <p class="meta">${escapeHtml(meta)}</p>
  <p class="meta">${escapeHtml(formatPeriod(entry))}</p>
</section>`;
          })
          .join("")
      : candidate.education?.trim()
        ? lines(candidate.education.trim())
        : "<p>No education recorded.</p>";

  const preferences = [
    candidate.preferredRole ? `Preferred role: ${candidate.preferredRole}` : "",
    candidate.preferredDestination ? `Preferred destination: ${candidate.preferredDestination}` : "",
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(candidate.fullName)} CV</title>
  <style>
    @page { margin: 18mm 16mm; }
    body {
      margin: 0;
      color: #111;
      font: 11pt/1.45 Arial, Helvetica, sans-serif;
    }
    h1 {
      margin: 0 0 4pt;
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: 0;
    }
    h2 {
      margin: 16pt 0 6pt;
      padding-bottom: 2pt;
      border-bottom: 1px solid #222;
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    h3 {
      margin: 0 0 2pt;
      font-size: 11pt;
      font-weight: 700;
    }
    p, li {
      margin: 0 0 4pt;
    }
    .contact, .meta {
      color: #333;
      font-size: 10pt;
    }
    .job, .school {
      margin: 0 0 10pt;
    }
    ul {
      margin: 0;
      padding-left: 16pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(candidate.fullName)}</h1>
    ${contact ? `<p class="contact">${escapeHtml(contact)}</p>` : ""}
    ${candidate.reference ? `<p class="meta">Candidate ID: ${escapeHtml(candidate.reference)}</p>` : ""}
  </header>

  ${summaryHtml ? `<section><h2>Professional summary</h2>${summaryHtml}</section>` : ""}

  <section>
    <h2>Work experience</h2>
    ${workHtml}
  </section>

  <section>
    <h2>Education</h2>
    ${educationHtml}
  </section>

  ${
    languageList.length > 0
      ? `<section><h2>Languages</h2><ul>${languageList.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : ""
  }

  ${
    preferences.length > 0
      ? `<section><h2>Preferences</h2><ul>${preferences.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : ""
  }
</body>
</html>`;
}

export function cvFilename(fullName: string) {
  const safe = fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return `${safe || "Candidate"}_CV.pdf`;
}
