export class AuthConfigurationError extends Error {
  constructor() {
    super("AUTH_SECRET is required in production.");
    this.name = "AuthConfigurationError";
  }
}

// Shared by the Node route handlers and Edge middleware so both verify the
// same sessions. Production must never fall back to the development key.
export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret?.trim()) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "netizen-local-auth-secret-change-me";
  }

  throw new AuthConfigurationError();
}
