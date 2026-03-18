const DM_PASSWORD = process.env.DM_PASSWORD || "noah";

export function verifyDMPassword(password: string): boolean {
  return password === DM_PASSWORD;
}

export function isDMAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("x-dm-password");
  return authHeader !== null && verifyDMPassword(authHeader);
}
