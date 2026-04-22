import "server-only";

const BASE = "https://www.robotevents.com/api/v2";

export type IdInfo = { id: number; name: string; code?: string | null };

export type Program = { id: number; abbr?: string; name: string };

export type Division = { id: number; name: string; order?: number };

export type EventLevel =
  | "World"
  | "National"
  | "Regional"
  | "State"
  | "Signature"
  | "Other";

export type EventType = "tournament" | "league" | "workshop" | "virtual";

export type Location = {
  venue?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

export type Event = {
  id: number;
  sku: string;
  name: string;
  start?: string;
  end?: string;
  season: IdInfo;
  program: IdInfo;
  location: Location;
  divisions?: Division[];
  level?: EventLevel;
  ongoing?: boolean;
  awards_finalized?: boolean;
  event_type?: EventType;
};

export type Team = {
  id: number;
  number: string;
  team_name?: string;
  robot_name?: string;
  organization?: string;
  location?: Location;
  registered?: boolean;
  program: IdInfo;
  grade?: "College" | "High School" | "Middle School" | "Elementary School";
};

export type Alliance = {
  color: "red" | "blue";
  score: number;
  teams: { team: IdInfo; sitting?: boolean }[];
};

export type MatchObj = {
  id: number;
  event: IdInfo;
  division: IdInfo;
  round: number;
  instance: number;
  matchnum: number;
  scheduled?: string;
  started?: string;
  field?: string;
  scored: boolean;
  name: string;
  alliances: Alliance[];
};

type PageMeta = {
  current_page?: number;
  last_page?: number;
  next_page_url?: string | null;
  per_page?: number;
  total?: number;
};

type Paginated<T> = { meta: PageMeta; data: T[] };

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | (string | number)[] | undefined>,
): string {
  const url = new URL(BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

async function call<T>(url: string, revalidate = 60): Promise<T> {
  const token = process.env.ROBOTEVENTS_TOKEN;
  if (!token) {
    throw new Error(
      "ROBOTEVENTS_TOKEN env var is not set. Get one from https://www.robotevents.com/api/v2 and add it to .env.local",
    );
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    next: { revalidate },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RobotEvents ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function callAll<T>(
  path: string,
  params?: Record<string, string | number | boolean | (string | number)[] | undefined>,
  revalidate = 60,
  maxPages = 20,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = buildUrl(path, { ...params, per_page: 250, page });
    const resp = await call<Paginated<T>>(url, revalidate);
    out.push(...resp.data);
    if (!resp.meta.next_page_url) break;
  }
  return out;
}

export async function getPrograms(): Promise<Program[]> {
  return callAll<Program>("/programs", undefined, 3600);
}

export async function findTeams(opts: {
  number?: string;
  programId?: number;
}): Promise<Team[]> {
  const params: Record<string, string | number | (string | number)[]> = {};
  if (opts.number) params["number[]"] = [opts.number];
  if (opts.programId) params["program[]"] = [opts.programId];
  return callAll<Team>("/teams", params, 60);
}

export async function getTeam(id: number): Promise<Team> {
  return call<Team>(buildUrl(`/teams/${id}`), 300);
}

export async function getTeamEvents(
  teamId: number,
  opts?: { start?: string; end?: string; season?: number[] },
): Promise<Event[]> {
  const params: Record<string, string | number | (string | number)[] | undefined> = {
    start: opts?.start,
    end: opts?.end,
  };
  if (opts?.season) params["season[]"] = opts.season;
  return callAll<Event>(`/teams/${teamId}/events`, params, 60);
}

export async function getEvent(id: number): Promise<Event> {
  return call<Event>(buildUrl(`/events/${id}`), 300);
}

export async function getDivisionMatches(
  eventId: number,
  divisionId: number,
): Promise<MatchObj[]> {
  return callAll<MatchObj>(
    `/events/${eventId}/divisions/${divisionId}/matches`,
    undefined,
    30,
  );
}

export async function getEventTeams(eventId: number): Promise<Team[]> {
  return callAll<Team>(`/events/${eventId}/teams`, undefined, 300);
}
