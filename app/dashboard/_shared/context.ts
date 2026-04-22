import "server-only";
import { cache } from "react";
import { readTeamCookie, type StoredTeam } from "../../lib/cookies";
import { loadEventBundle, pickCurrentEvent } from "../../lib/schedule";
import type { Event, MatchObj } from "../../lib/robotevents";

export type DashboardContext =
  | {
      ok: true;
      team: StoredTeam;
      now: Date;
      event: Event;
      matches: MatchObj[];
    }
  | { ok: false; team: StoredTeam | null; error?: string; reason: "no-team" | "no-event" | "error" };

// React's cache() dedupes within a single request so each page under
// /dashboard shares the same fetch for event + matches.
export const getDashboardContext = cache(
  async (): Promise<DashboardContext> => {
    const team = await readTeamCookie();
    if (!team) return { ok: false, team: null, reason: "no-team" };
    const now = new Date();
    try {
      const event = await pickCurrentEvent(team.id, now);
      if (!event) return { ok: false, team, reason: "no-event" };
      const bundle = await loadEventBundle(event.id);
      return { ok: true, team, now, event, matches: bundle.matches };
    } catch (e) {
      return {
        ok: false,
        team,
        reason: "error",
        error: (e as Error).message,
      };
    }
  },
);
