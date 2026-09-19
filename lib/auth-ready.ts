export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export const publicAuthPaths = [
  "/login",
  "/mock",
  "/be-nosy",
  "/api/auth",
  "/api/register",
  "/api/cron",
  "/api/industries",
];

export function isPublicAuthPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return publicAuthPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
