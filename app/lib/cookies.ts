import "server-only";
import { cookies } from "next/headers";

export const TEAM_COOKIE = "vex_team";
export const TIMEZONE_COOKIE = "vex_tz";

export type StoredTeam = {
  id: number;
  number: string;
  name?: string;
  programId: number;
  programName?: string;
};

export async function readTeamCookie(): Promise<StoredTeam | null> {
  const c = await cookies();
  const raw = c.get(TEAM_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTeam;
    if (typeof parsed?.id === "number" && typeof parsed?.number === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function writeTeamCookie(team: StoredTeam) {
  const c = await cookies();
  c.set(TEAM_COOKIE, JSON.stringify(team), {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearTeamCookie() {
  const c = await cookies();
  c.delete(TEAM_COOKIE);
}

export async function readTimezoneCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(TIMEZONE_COOKIE)?.value || null;
}

export async function writeTimezoneCookie(tz: string) {
  const c = await cookies();
  c.set(TIMEZONE_COOKIE, tz, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearTimezoneCookie() {
  const c = await cookies();
  c.delete(TIMEZONE_COOKIE);
}
