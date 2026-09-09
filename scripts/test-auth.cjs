/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test, beforeEach, after } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const prisma = { adminUser: {}, customer: {} };
const originalLoad = Module._load;
const originalResolve = Module._resolveFilename;

// Run the actual handlers and crypto code with an isolated database double.
// No database, real account, server, or browser is used by these checks.
Module._load = function (request, ...args) {
  if (request === "@/lib/db") return { prisma };
  return originalLoad.call(this, request, ...args);
};
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith("@/")
    ? path.join(root, "src", request.slice(2)) : request, ...args);
};
Module._extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  } }).outputText, filename);
};

const { NextRequest } = require("next/server");
const auth = require("../src/lib/auth.ts");
const { POST } = require("../src/app/api/auth/login/route.ts");
const { middleware } = require("../src/middleware.ts");
const nextConfig = require("../next.config.ts").default;
const envKeys = ["NODE_ENV", "AUTH_SECRET", "NEXTAUTH_SECRET", "ADMIN_LOGIN", "ADMIN_PASSWORD"];
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const fixturePassword = "test-only-password";
const fixtureHash = auth.hashPassword(fixturePassword);
let sequence = 0;
let upsertCalls = 0;

beforeEach(context => {
  context.mock.method(console, "error", () => {});
  process.env.NODE_ENV = "production";
  process.env.AUTH_SECRET = "test-only-session-secret-never-use-in-production";
  delete process.env.NEXTAUTH_SECRET;
  process.env.ADMIN_LOGIN = `test-admin-${++sequence}`;
  process.env.ADMIN_PASSWORD = fixturePassword;
  upsertCalls = 0;
  prisma.adminUser.upsert = async ({ create }) => {
    upsertCalls++;
    return create;
  };
  prisma.adminUser.findUnique = async () => null;
  prisma.customer.findFirst = async () => null;
});

after(() => {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  Module._load = originalLoad;
  Module._resolveFilename = originalResolve;
});

function login(login = process.env.ADMIN_LOGIN, password = fixturePassword) {
  return POST(new Request("https://store.test/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  }));
}

function protectedRequest(token, pathname = "/api/admin/products") {
  return new NextRequest(`https://store.test${pathname}`, {
    headers: token ? { Cookie: `${auth.AUTH_COOKIE_NAME}=${token}` } : {},
  });
}

function adminToken(roles = ["owner"]) {
  return auth.createAuthSessionToken({
    role: "admin", login: "test-staff", roles,
    createdAt: new Date().toISOString(),
  });
}

test("configured administrator receives a verifiable cookie and can open the console", async () => {
  const response = await login();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.redirectTo, "/nz-console");
  assert.equal(body.user.role, "admin");
  assert.equal(upsertCalls, 1);
  const cookie = response.cookies.get(auth.AUTH_COOKIE_NAME);
  assert(cookie.httpOnly && cookie.secure);
  assert.equal(cookie.sameSite, "lax");
  assert.equal(cookie.path, "/");
  assert.deepEqual(auth.parseAuthSessionToken(cookie.value).roles, ["owner"]);
  const access = await middleware(protectedRequest(cookie.value, "/nz-console"));
  assert.equal(access.headers.get("x-middleware-next"), "1");
});

test("missing signing key gives JSON 503 before any admin record is changed", async () => {
  delete process.env.AUTH_SECRET;
  const response = await login();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "AUTH_NOT_CONFIGURED");
  assert.equal(upsertCalls, 0);
  assert.equal(response.cookies.get(auth.AUTH_COOKIE_NAME), undefined);
});

test("an asynchronous admin database failure is caught and never issues a session", async () => {
  prisma.adminUser.upsert = async () => { throw new Error("test database unavailable"); };
  const response = await login();
  assert.equal(response.status, 500);
  assert.equal((await response.json()).code, "AUTH_SERVER_ERROR");
  assert.equal(response.cookies.get(auth.AUTH_COOKIE_NAME), undefined);
});

test("existing NEXTAUTH_SECRET configuration remains supported", async () => {
  process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
  delete process.env.AUTH_SECRET;
  const response = await login();
  assert.equal(response.status, 200);
  const access = await middleware(protectedRequest(response.cookies.get(auth.AUTH_COOKIE_NAME).value));
  assert.equal(access.headers.get("x-middleware-next"), "1");
});

test("an active database staff account keeps its assigned roles", async () => {
  prisma.adminUser.findUnique = async () => ({
    login: "test-staff", name: "Test staff", role: "manager", roles: ["manager"],
    passwordHash: fixtureHash, isActive: true,
  });
  const response = await login("test-staff");
  assert.equal(response.status, 200);
  const token = response.cookies.get(auth.AUTH_COOKIE_NAME).value;
  assert.deepEqual(auth.parseAuthSessionToken(token).roles, ["manager"]);
  assert.equal((await middleware(protectedRequest(token, "/api/admin/orders"))).status, 200);
  assert.equal((await middleware(protectedRequest(token, "/api/admin/staff"))).status, 403);
  assert.equal(upsertCalls, 0);
});

test("invalid credentials are rejected without a session", async () => {
  const response = await login(undefined, "wrong-test-password");
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(auth.AUTH_COOKIE_NAME), undefined);
  assert.equal(upsertCalls, 0);
});

test("disabled database staff cannot sign in with the correct password", async () => {
  prisma.adminUser.findUnique = async () => ({
    login: "disabled-test-staff", passwordHash: fixtureHash, isActive: false,
  });
  const response = await login("disabled-test-staff");
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(auth.AUTH_COOKIE_NAME), undefined);
});

test("customer login still works and cannot access administrator endpoints", async () => {
  prisma.customer.findFirst = async () => ({
    id: "test-customer", name: "Test", lastName: "Customer", phone: "+79990000000",
    email: "customer@example.test", passwordHash: fixtureHash,
  });
  const response = await login("customer@example.test");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).redirectTo, "/profile");
  const token = response.cookies.get(auth.AUTH_COOKIE_NAME).value;
  assert.equal(auth.parseAuthSessionToken(token).role, "customer");
  assert.equal((await middleware(protectedRequest(token))).status, 401);
});

test("malformed, tampered, and expired cookies fail closed", context => {
  assert.equal(auth.parseAuthSessionToken("invalid.invalid"), null);
  const token = adminToken();
  assert.equal(auth.parseAuthSessionToken(token + "tampered"), null);
  const now = Date.now();
  context.mock.method(Date, "now", () => now + 31 * 24 * 60 * 60 * 1000);
  assert.equal(auth.parseAuthSessionToken(token), null);
});

test("missing production key neither crashes cookie reads nor accepts the development key", async () => {
  process.env.NODE_ENV = "development";
  delete process.env.AUTH_SECRET;
  const token = adminToken();
  process.env.NODE_ENV = "production";
  assert.equal(auth.parseAuthSessionToken(token), null);
  assert.equal(auth.parseAuthSessionToken("invalid.invalid"), null);
  assert.equal((await middleware(protectedRequest(token))).status, 401);
  assert.equal((await middleware(protectedRequest(undefined, "/nz-console"))).status, 307);
});

test("repeated failed logins remain rate limited", async () => {
  for (let attempt = 0; attempt < 8; attempt++) {
    assert.equal((await login("rate-limit-test", "wrong-test-password")).status, 401);
  }
  const response = await login("rate-limit-test", "wrong-test-password");
  assert.equal(response.status, 429);
  assert.equal(response.cookies.get(auth.AUTH_COOKIE_NAME), undefined);
});

test("authentication responses override public API caching", async () => {
  const headers = await nextConfig.headers();
  const publicIndex = headers.findIndex(entry => entry.source === "/api/:path*");
  const authIndex = headers.findIndex(entry => entry.source === "/api/auth/:path*");
  assert(authIndex > publicIndex);
  assert.equal(headers[authIndex].headers.find(header => header.key === "Cache-Control").value,
    "private, no-store, max-age=0");
});
