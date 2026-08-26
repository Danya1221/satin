import crypto from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "netizen_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type AuthRole = "customer" | "admin";
export type AdminRole = "owner" | "admin" | "manager" | "content" | "support";

export const adminRoleValues: AdminRole[] = ["owner", "admin", "manager", "content", "support"];

export type AuthSessionPayload = {
  role: AuthRole;
  createdAt: string;
  expiresAt: number;
  customerId?: string;
  name?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  login?: string;
  adminRole?: AdminRole;
  roles?: AdminRole[];
};

export type PublicAuthUser = {
  role: AuthRole;
  profile?: {
    id?: string;
    name: string;
    lastName: string;
    phone: string;
    email: string;
  };
};

function getAuthSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "netizen-local-auth-secret-change-me");

  if (!secret) {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function normalizeAdminRoles(value: unknown, fallback: AdminRole[] = ["manager"]): AdminRole[] {
  const source = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const normalized = source
    .map((role) => (typeof role === "string" ? role.trim() : ""))
    .filter((role): role is AdminRole => (adminRoleValues as string[]).includes(role));

  return Array.from(new Set(normalized.length ? normalized : fallback));
}

export function hasAdminRole(session: AuthSessionPayload | null | undefined, role: AdminRole) {
  if (!session || session.role !== "admin") {
    return false;
  }

  return normalizeAdminRoles(session.roles, session.adminRole ? [session.adminRole] : ["manager"]).includes(role);
}

export function isOwnerSession(session: AuthSessionPayload | null | undefined) {
  return hasAdminRole(session, "owner");
}

export function createAuthSessionToken(payload: Omit<AuthSessionPayload, "expiresAt">) {
  const session: AuthSessionPayload = {
    ...payload,
    roles: payload.role === "admin" ? normalizeAdminRoles(payload.roles, payload.adminRole ? [payload.adminRole] : ["manager"]) : payload.roles,
    expiresAt: Date.now() + AUTH_COOKIE_MAX_AGE * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function parseAuthSessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as AuthSessionPayload;

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    if (payload.role === "admin") {
      payload.roles = normalizeAdminRoles(payload.roles, payload.adminRole ? [payload.adminRole] : ["manager"]);
      payload.adminRole = payload.roles[0];
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  return parseAuthSessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");

  if (candidate.length !== hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
