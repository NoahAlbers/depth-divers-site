import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "DM only" }, { status: 403 });
  }

  const { name, description, category, hidden, icon } = await request.json();

  if (!name || !description || !category) {
    return NextResponse.json(
      { error: "name, description, and category required" },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Get max order
  const maxOrder = await prisma.achievementDefinition.aggregate({
    _max: { order: true },
  });

  const definition = await prisma.achievementDefinition.create({
    data: {
      slug,
      name,
      description,
      category,
      hidden: hidden || false,
      icon: icon || "🏆",
      order: (maxOrder._max.order || 0) + 1,
    },
  });

  return NextResponse.json({ definition }, { status: 201 });
}
