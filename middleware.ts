import { NextRequest, NextResponse } from "next/server";

type AdminRole = "owner" | "admin" | "manager" | "content" | "support";
type AdminSection =
  | "dashboard"
  | "orders"
  | "customers"
  | "products"
  | "positions"
  | "categories"
  | "support"
  | "site-editor"
  | "settings"
  | "staff";

const AUTH_COOKIE_NAME = "netizen_session";
const allRoles: AdminRole[] = ["owner", "admin", "manager", "content", "support"];

const accessMap: Record<AdminSection, AdminRole[]> = {
  dashboard: allRoles,
  orders: ["owner", "admin", "manager"],
  customers: ["owner", "admin", "manager"],
  products: ["owner", "admin", "content"],
  positions: ["owner", "admin", "manager", "content"],
  categories: ["owner", "admin", "content"],
  support: ["owner", "admin", "manager", "support"],
  "site-editor": ["owner", "admin", "content"],
  settings: ["owner"],
  staff: ["owner"],
};

function base64UrlToUint8Array(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const decoded = atob(padded);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "netizen-local-auth-secret-change-me";
}

async function signPayload(encodedPayload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  return uint8ArrayToBase64Url(new Uint8Array(signature));
}

async function readSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signPayload(encodedPayload).catch(() => "");

  if (!expectedSignature || expectedSignature !== signature) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(encodedPayload))) as {
      role?: string;
      roles?: string[];
      adminRole?: string;
      expiresAt?: number;
    };

    if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

function normalizeRoles(session: Awaited<ReturnType<typeof readSession>>): AdminRole[] {
  if (!session || session.role !== "admin") return [];

  const source = Array.isArray(session.roles) && session.roles.length ? session.roles : session.adminRole ? [session.adminRole] : ["manager"];
  const roles = source.filter((role): role is AdminRole => allRoles.includes(role as AdminRole));

  return Array.from(new Set(roles.length ? roles : ["manager"]));
}

function getSection(pathname: string): AdminSection {
  if (pathname.startsWith("/nz-console/settings") || pathname.startsWith("/api/admin/staff")) return "settings";
  if (pathname.startsWith("/nz-console/site-editor")) return "site-editor";
  if (pathname.startsWith("/api/admin/page-blocks") || pathname.startsWith("/api/admin/site-banners") || pathname.startsWith("/api/admin/site-benefits") || pathname.startsWith("/api/admin/site-settings")) return "site-editor";
  if (pathname.startsWith("/nz-console/orders") || pathname.startsWith("/api/admin/orders")) return "orders";
  if (pathname.startsWith("/nz-console/users")) return "customers";
  if (pathname.startsWith("/nz-console/support")) return "support";
  if (pathname.startsWith("/nz-console/categories") || pathname.startsWith("/api/admin/categories")) return "categories";
  if (pathname.startsWith("/nz-console/positions") || pathname.startsWith("/api/admin/positions") || pathname.includes("/variants")) return "positions";
  if (pathname.startsWith("/nz-console/products") || pathname.startsWith("/api/admin/products")) return "products";

  return "dashboard";
}

function hasSectionAccess(roles: AdminRole[], section: AdminSection) {
  if (roles.includes("owner")) return true;
  return roles.some((role) => accessMap[section].includes(role));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await readSession(request);
  const isAdminRequest = pathname.startsWith("/api/admin");

  if (session?.role !== "admin") {
    if (isAdminRequest) {
      return NextResponse.json({ ok: false, error: "Нужно войти в админку." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  const section = getSection(pathname);
  const roles = normalizeRoles(session);

  if (!hasSectionAccess(roles, section)) {
    if (isAdminRequest) {
      return NextResponse.json({ ok: false, error: "Недостаточно прав для этого раздела." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/nz-console?access=denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/nz-console/:path*", "/api/admin/:path*"],
};
