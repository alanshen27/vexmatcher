import "server-only";
import { cache } from "react";
import {
  readTeamCookie,
  readTimezoneCookie,
  type StoredTeam,
} from "../../lib/cookies";
import { loadEventBundle, pickCurrentEvent } from "../../lib/schedule";
import type { Event, MatchObj } from "../../lib/robotevents";

export type DashboardContext =
  | {
      ok: true;
      team: StoredTeam;
      now: Date;
      event: Event;
      matches: MatchObj[];
      tz: string | null;
    }
  | {
      ok: false;
      team: StoredTeam | null;
      tz: string | null;
      error?: string;
      reason: "no-team" | "no-event" | "error";
    };

// React's cache() dedupes within a single request so each page under
// /dashboard shares the same fetch for event + matches.
export const getDashboardContext = cache(
  async (): Promise<DashboardContext> => {
    const [team, tz] = await Promise.all([
      readTeamCookie(),
      readTimezoneCookie(),
    ]);
    if (!team) return { ok: false, team: null, tz, reason: "no-team" };
    const now = new Date();
    try {
      const event = await pickCurrentEvent(team.id, now);
      if (!event) return { ok: false, team, tz, reason: "no-event" };
      const bundle = await loadEventBundle(event.id);
      return { ok: true, team, now, event, matches: bundle.matches, tz };
    } catch (e) {
      return {
        ok: false,
        team,
        tz,
        reason: "error",
        error: (e as Error).message,
      };
    }
  },
);
