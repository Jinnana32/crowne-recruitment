import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data/source";

export function jsonData<T>(data: T, status = 200) {
  const source = getDataSource();
  return NextResponse.json(
    {
      data,
      meta: {
        source,
        illustrative: source === "demo",
      },
    },
    { status },
  );
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
