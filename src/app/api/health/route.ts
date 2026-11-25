import { jsonData } from "@/lib/api/http";

export async function GET() {
  return jsonData({ ok: true, service: "crowne-orms" });
}
