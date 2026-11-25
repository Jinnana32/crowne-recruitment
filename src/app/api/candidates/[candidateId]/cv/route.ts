import { jsonError } from "@/lib/api/http";
import { requireSession } from "@/lib/auth/guard";
import { cvFilename, renderAtsCvHtml } from "@/lib/cv/ats-template";
import { renderHtmlToPdf } from "@/lib/cv/render-pdf";
import { getCandidate, listEducation, listWorkExperience } from "@/lib/data/repository";

type Context = { params: Promise<{ candidateId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;

  const { candidateId } = await context.params;
  try {
    const candidate = await getCandidate(candidateId);
    if (!candidate) return jsonError(404, "not_found", "That candidate was not found.");

    const [workExperience, education] = await Promise.all([
      listWorkExperience(candidateId),
      listEducation(candidateId),
    ]);

    const html = renderAtsCvHtml({ candidate, workExperience, education });
    const pdf = await renderHtmlToPdf(html);
    const filename = cvFilename(candidate.fullName);

    return new Response(pdf, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError(500, "cv_failed", error instanceof Error ? error.message : "The CV could not be generated.");
  }
}
