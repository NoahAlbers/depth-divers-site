import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDMAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const entry = await prisma.initiative.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.roll !== undefined && { roll: Number(data.roll) }),
      ...(data.isPlayer !== undefined && { isPlayer: data.isPlayer }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDMAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.initiative.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
