import "server-only";
import {
  getDivisionMatches,
  getEvent,
  getTeamEvents,
  type Event,
  type MatchObj,
} from "./robotevents";

export type EventBundle = {
  event: Event;
  matches: MatchObj[];
};

export async function pickCurrentEvent(
  teamId: number,
  now: Date = new Date(),
): Promise<Event | null> {
  const earliest = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);
  const latest = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60);
  const events = await getTeamEvents(teamId, {
    start: earliest.toISOString(),
    end: latest.toISOString(),
  });
  if (!events.length) {
    const future = await getTeamEvents(teamId, { start: now.toISOString() });
    return future[0] ?? null;
  }
  const ranked = events
    .map((e) => ({
      e,
      start: e.start ? new Date(e.start).getTime() : 0,
      end: e.end ? new Date(e.end).getTime() : 0,
    }))
    .sort((a, b) => a.start - b.start);
  const ongoing = ranked.find(
    (r) => r.start <= now.getTime() && r.end + 86400000 >= now.getTime(),
  );
  if (ongoing) return ongoing.e;
  const upcoming = ranked.find((r) => r.start >= now.getTime());
  if (upcoming) return upcoming.e;
  return ranked[ranked.length - 1]?.e ?? null;
}

export async function loadEventBundle(eventId: number): Promise<EventBundle> {
  const event = await getEvent(eventId);
  const divisions = event.divisions?.length
    ? event.divisions
    : [{ id: 1, name: "Division 1" }];
  const matches = (
    await Promise.all(divisions.map((d) => getDivisionMatches(event.id, d.id)))
  ).flat();
  matches.sort((a, b) => sortKey(a) - sortKey(b));
  return { event, matches };
}

function sortKey(m: MatchObj): number {
  if (m.scheduled) return new Date(m.scheduled).getTime();
  return (
    m.round * 1_000_000_000 + m.instance * 1_000_000 + m.matchnum * 1000
  );
}

export type AllianceSide = "red" | "blue";

export function teamsInMatch(m: MatchObj): { id: number; number: string; side: AllianceSide }[] {
  const out: { id: number; number: string; side: AllianceSide }[] = [];
  for (const a of m.alliances) {
    for (const t of a.teams) {
      if (t.team) {
        out.push({
          id: t.team.id,
          number: t.team.name ?? String(t.team.id),
          side: a.color,
        });
      }
    }
  }
  return out;
}

export function findTeamSide(m: MatchObj, teamId: number): AllianceSide | null {
  for (const a of m.alliances) {
    for (const t of a.teams) {
      if (t.team?.id === teamId) return a.color;
    }
  }
  return null;
}

export function partnersAndOpponents(
  m: MatchObj,
  teamId: number,
): { partners: { id: number; number: string }[]; opponents: { id: number; number: string }[] } {
  const side = findTeamSide(m, teamId);
  const partners: { id: number; number: string }[] = [];
  const opponents: { id: number; number: string }[] = [];
  for (const a of m.alliances) {
    for (const t of a.teams) {
      if (!t.team) continue;
      if (t.team.id === teamId) continue;
      const entry = {
        id: t.team.id,
        number: t.team.name ?? String(t.team.id),
      };
      if (side && a.color === side) partners.push(entry);
      else opponents.push(entry);
    }
  }
  return { partners, opponents };
}

export function matchesForTeam(matches: MatchObj[], teamId: number): MatchObj[] {
  return matches.filter((m) => findTeamSide(m, teamId) !== null);
}

export function upcomingMatches(matches: MatchObj[], now: Date = new Date()): MatchObj[] {
  return matches.filter((m) => {
    if (m.scored) return false;
    if (m.scheduled && new Date(m.scheduled).getTime() < now.getTime() - 5 * 60 * 1000) {
      return false;
    }
    return true;
  });
}
