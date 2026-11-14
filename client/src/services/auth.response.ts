import type { AuthResponse, User } from "../types/auth.types";

interface BackendAuthEnvelope {
  accessToken?: string;
  user?: User;
  data?: User | {
    accessToken?: string;
    user?: User;
  };
}

export function normalizeAuthResponse(
  response: unknown,
): AuthResponse {
  const body = response as { data?: unknown } | undefined;
  const payload = body?.data as BackendAuthEnvelope | undefined;
  const session = payload?.accessToken
    ? payload
    : (payload?.data as BackendAuthEnvelope | undefined);
  const user = session?.user ?? (session?.data as User | undefined);

  if (!session?.accessToken || !user) {
    throw new Error("Login failed — unexpected response from the server.");
  }

  return {
    accessToken: session.accessToken,
    user,
  };
}
