import { jsonData, jsonError } from "@/lib/api/http";
import { DataUnavailableError } from "@/lib/data/repository";

/** Like respond, but the work builds its own response (for 404s, 409s, and file bodies). */
export async function guarded(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return jsonError(503, "unavailable", error.message);
    }
    console.error(error);
    return jsonError(500, "server_error", "The request could not be completed.");
  }
}

export async function respond(work: () => Promise<unknown>) {
  try {
    return jsonData(await work());
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return jsonError(503, "unavailable", error.message);
    }
    console.error(error);
    return jsonError(500, "server_error", "The request could not be completed.");
  }
}
