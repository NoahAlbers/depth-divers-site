import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");

  if (!player) {
    return NextResponse.json({ error: "player required" }, { status: 400 });
  }

  // Auto-create with defaults if not exists
  let sheet = await prisma.characterSheet.findUnique({
    where: { playerName: player },
  });

  if (!sheet) {
    sheet = await prisma.characterSheet.create({
      data: { playerName: player },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheetAny = sheet as any;
  return NextResponse.json({
    sheet: {
      ...sheet,
      race: sheet.race || null,
      class: sheetAny.class || null,
      skills: JSON.parse(sheet.skills),
    },
    lastUpdated: new Date().toISOString(),
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { playerName, ...fields } = body;

  if (!playerName) {
    return NextResponse.json({ error: "playerName required" }, { status: 400 });
  }

  // Validate ability scores
  const abilityFields = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
  for (const f of abilityFields) {
    if (fields[f] !== undefined) {
      const val = Number(fields[f]);
      if (isNaN(val) || val < 1 || val > 30) {
        return NextResponse.json({ error: `${f} must be 1-30` }, { status: 400 });
      }
      fields[f] = val;
    }
  }

  if (fields.level !== undefined) {
    const lvl = Number(fields.level);
    if (isNaN(lvl) || lvl < 1 || lvl > 20) {
      return NextResponse.json({ error: "level must be 1-20" }, { status: 400 });
    }
    fields.level = lvl;
  }

  if (fields.movementSpeed !== undefined) {
    fields.movementSpeed = Number(fields.movementSpeed);
  }

  // Stringify skills if provided as object
  if (fields.skills && typeof fields.skills === "object") {
    fields.skills = JSON.stringify(fields.skills);
  }

  const sheet = await prisma.characterSheet.upsert({
    where: { playerName },
    update: fields,
    create: { playerName, ...fields },
  });

  return NextResponse.json({
    sheet: { ...sheet, skills: JSON.parse(sheet.skills) },
  });
}
