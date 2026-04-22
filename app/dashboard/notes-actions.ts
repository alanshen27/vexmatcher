"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { readTeamCookie } from "../lib/cookies";
import type { MatchNote } from "./notes-types";

export async function getNotesForTeam(
  matchIds: number[],
): Promise<Map<number, MatchNote>> {
  const team = await readTeamCookie();
  const out = new Map<number, MatchNote>();
  if (!team || matchIds.length === 0) return out;
  const rows = await prisma.matchNote.findMany({
    where: { teamId: team.id, matchId: { in: matchIds } },
  });
  for (const r of rows) {
    out.set(r.matchId, {
      matchId: r.matchId,
      done: r.done,
      notes: r.notes,
    });
  }
  return out;
}

export async function toggleDoneAction(formData: FormData): Promise<void> {
  const matchId = Number(formData.get("matchId"));
  const done = formData.get("done") === "true";
  const team = await readTeamCookie();
  if (!team || !matchId) return;
  await prisma.matchNote.upsert({
    where: { teamId_matchId: { teamId: team.id, matchId } },
    create: { teamId: team.id, matchId, done, notes: "" },
    update: { done },
  });
  revalidatePath("/dashboard");
}

export async function saveNotesAction(formData: FormData): Promise<void> {
  const matchId = Number(formData.get("matchId"));
  const notes = String(formData.get("notes") ?? "").slice(0, 4000);
  const team = await readTeamCookie();
  if (!team || !matchId) return;
  await prisma.matchNote.upsert({
    where: { teamId_matchId: { teamId: team.id, matchId } },
    create: { teamId: team.id, matchId, done: false, notes },
    update: { notes },
  });
  revalidatePath("/dashboard");
}
