import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function isDMAuthorized(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("x-dm-password");
  if (!authHeader) return false;

  try {
    const dm = await prisma.player.findUnique({ where: { name: "Noah" } });
    if (!dm) return false;
    return bcrypt.compare(authHeader, dm.password);
  } catch {
    return false;
  }
}
