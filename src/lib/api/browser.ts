"use client";

type ErrorBody = { error?: { message?: string } };
type SuccessBody<T> = { data: T; meta?: { source?: string; illustrative?: boolean } };

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<SuccessBody<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json()) as SuccessBody<T> & ErrorBody;
  if (!response.ok) {
    throw new ApiError(body.error?.message ?? "The request could not be completed.");
  }
  return body;
}
