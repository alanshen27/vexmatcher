"use server";

import { redirect } from "next/navigation";
import { findTeams } from "../lib/robotevents";
import { clearTeamCookie, writeTeamCookie } from "../lib/cookies";

export type SearchState = {
  ok: boolean;
  error?: string;
  number?: string;
  programId?: string;
  results?: {
    id: number;
    number: string;
    name: string;
    programId: number;
    programName: string;
    organization?: string;
    location?: string;
  }[];
};

export async function searchTeamsAction(
  _prev: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const number = String(formData.get("number") ?? "").trim();
  const programIdRaw = String(formData.get("programId") ?? "").trim();
  const programId = programIdRaw ? Number(programIdRaw) : undefined;

  if (!number) {
    return { ok: false, error: "Enter a team number." };
  }

  try {
    const teams = await findTeams({ number, programId });
    if (teams.length === 0) {
      return {
        ok: false,
        number,
        programId: programIdRaw,
        error: `No teams found for "${number}"${
          programId ? " in that program" : ""
        }.`,
      };
    }
    return {
      ok: true,
      number,
      programId: programIdRaw,
      results: teams.map((t) => ({
        id: t.id,
        number: t.number,
        name: t.team_name ?? "",
        programId: t.program.id,
        programName: t.program.name,
        organization: t.organization,
        location: [t.location?.city, t.location?.region, t.location?.country]
          .filter(Boolean)
          .join(", "),
      })),
    };
  } catch (e) {
    return {
      ok: false,
      number,
      programId: programIdRaw,
      error: (e as Error).message,
    };
  }
}

export async function chooseTeamAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const number = String(formData.get("number") ?? "");
  const name = String(formData.get("name") ?? "");
  const programId = Number(formData.get("programId"));
  const programName = String(formData.get("programName") ?? "");
  if (!id || !number) return;
  await writeTeamCookie({ id, number, name, programId, programName });
  redirect("/dashboard");
}

export async function resetTeamAction(): Promise<void> {
  await clearTeamCookie();
  redirect("/onboarding");
}
