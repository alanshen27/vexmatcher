import {
  findTeamSide,
  matchesForTeam,
  partnersAndOpponents,
  upcomingMatches,
} from "../../lib/schedule";
import Link from "next/link";
import { fmtTime, relativeTime, shortMatchName } from "../../lib/format";
import type { MatchObj } from "../../lib/robotevents";
import { getDashboardContext } from "../_shared/context";
import { EmptyState, ErrorBox, Hint, Section, SideBadge } from "../_shared/ui";
import MatchNotes from "../MatchNotes";
import { getNotesForTeam } from "../notes-actions";
import type { MatchNote } from "../notes-types";
import ScrollToTeam from "./ScrollToTeam";

type PageProps = {
  searchParams: Promise<{
    highlight?: string | string[];
  }>;
};

function scheduleHref(matchId: number) {
  return `/dashboard/schedule?highlight=${matchId}`;
}

function firstStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function isPast(m: MatchObj, now: Date): boolean {
  if (m.scored) return true;
  if (m.scheduled && new Date(m.scheduled).getTime() < now.getTime() - 5 * 60 * 1000)
    return true;
  return false;
}

export default async function ScoutPage({ searchParams }: PageProps) {
  const ctx = await getDashboardContext();
  if (!ctx.ok) {
    if (ctx.reason === "no-event") {
      return (
        <EmptyState
          title="Nothing to scout"
          body="You don't have any upcoming events yet."
          action={{ href: "/onboarding", label: "Switch team" }}
        />
      );
    }
    return <ErrorBox message={ctx.error ?? "Unknown error"} />;
  }

  const { team, matches: allMatches, now, tz } = ctx;
  const myMatches = matchesForTeam(allMatches, team.id);
  const myUpcoming = upcomingMatches(myMatches, now).slice(0, 8);

  const partnerIds = new Map<number, string>();
  const opponentIds = new Map<number, string>();
  const partnerByMatch = new Map<number, { id: number; number: string }[]>();
  const opponentByMatch = new Map<number, { id: number; number: string }[]>();
  for (const m of myUpcoming) {
    const { partners, opponents } = partnersAndOpponents(m, team.id);
    partnerByMatch.set(m.id, partners);
    opponentByMatch.set(m.id, opponents);
    for (const p of partners) partnerIds.set(p.id, p.number);
    for (const o of opponents) opponentIds.set(o.id, o.number);
  }

  const relevantTeams = new Set<number>([
    ...partnerIds.keys(),
    ...opponentIds.keys(),
  ]);

  // For each partner/opponent, pull a window of their matches around "now":
  // up to 2 most recent scored matches + up to 4 upcoming. This way scouts
  // can see recent form as well as what's coming.
  const otherByTeam = new Map<number, MatchObj[]>();
  for (const otherId of relevantTeams) {
    const theirs = allMatches.filter(
      (m) => findTeamSide(m, otherId) !== null && !myMatches.includes(m),
    );
    const past = theirs.filter((m) => isPast(m, now)).slice(-2);
    const future = upcomingMatches(theirs, now).slice(0, 4);
    otherByTeam.set(otherId, [...past, ...future]);
  }

  // "With you" is every match (past or upcoming) where my team plays with/against the other team.
  const sharedByTeam = new Map<number, MatchObj[]>();
  for (const otherId of relevantTeams) {
    sharedByTeam.set(
      otherId,
      myMatches.filter((m) =>
        m.alliances.some((a) =>
          a.teams.some((t) => t.team?.id === otherId),
        ),
      ),
    );
  }

  const matchIds = new Set<number>();
  for (const ms of otherByTeam.values()) for (const m of ms) matchIds.add(m.id);
  for (const ms of sharedByTeam.values()) for (const m of ms) matchIds.add(m.id);
  const notes = await getNotesForTeam([...matchIds]);

  // ?highlight=<matchId> → spotlight every partner/opponent from that match.
  const sp = await searchParams;
  const highlightMatchId = Number(firstStr(sp.highlight)) || null;
  const highlightMatch = highlightMatchId
    ? allMatches.find((m) => m.id === highlightMatchId) ?? null
    : null;
  const highlightedTeamIds = new Set<number>();
  if (highlightMatch) {
    for (const a of highlightMatch.alliances) {
      for (const t of a.teams) {
        if (t.team && t.team.id !== team.id) {
          highlightedTeamIds.add(t.team.id);
        }
      }
    }
  }
  const firstHighlightedId =
    [...partnerIds.keys(), ...opponentIds.keys()].find((id) =>
      highlightedTeamIds.has(id),
    ) ?? null;

  return (
    <div className="grid grid-cols-1 gap-12">
      {highlightMatch ? (
        <div className="flex items-center justify-between gap-3 border border-accent bg-subtle px-4 py-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted">
              Scouting focus
            </span>
            <span className="text-sm">
              Highlighting teams from{" "}
              <span className="font-mono font-semibold">
                {shortMatchName(highlightMatch)}
              </span>
              {highlightedTeamIds.size > 0
                ? ` · ${highlightedTeamIds.size} team${highlightedTeamIds.size === 1 ? "" : "s"}`
                : ""}
            </span>
          </div>
          <Link
            href="/dashboard/scout"
            className="text-xs uppercase tracking-widest border border-line bg-bg px-3 py-2 hover:bg-subtle transition-colors"
          >
            Clear
          </Link>
        </div>
      ) : null}

      <Section
        eyebrow="Your alliance partners"
        title="Teammates next up"
        subtitle="Teams you're paired with — and where to find them."
      >
        {partnerIds.size === 0 ? (
          <Hint>No alliance partners scheduled yet.</Hint>
        ) : (
          <TeamGrid
            teams={[...partnerIds.entries()].map(([id, number]) => ({
              id,
              number,
            }))}
            myTeamId={team.id}
            shared={(id) => sharedByTeam.get(id) ?? []}
            others={(id) => otherByTeam.get(id) ?? []}
            notes={notes}
            now={now}
            tz={tz}
            tone="partner"
            highlightedTeamIds={highlightedTeamIds}
            highlightMatchId={highlightMatchId}
          />
        )}
      </Section>

      <Section
        eyebrow="Your opponents"
        title="Scout the other side"
        subtitle="Teams you're up against — see their other matches."
      >
        {opponentIds.size === 0 ? (
          <Hint>No opponents scheduled yet.</Hint>
        ) : (
          <TeamGrid
            teams={[...opponentIds.entries()].map(([id, number]) => ({
              id,
              number,
            }))}
            myTeamId={team.id}
            shared={(id) => sharedByTeam.get(id) ?? []}
            others={(id) => otherByTeam.get(id) ?? []}
            notes={notes}
            now={now}
            tz={tz}
            tone="opponent"
            highlightedTeamIds={highlightedTeamIds}
            highlightMatchId={highlightMatchId}
          />
        )}
      </Section>

      {firstHighlightedId ? (
        <ScrollToTeam teamId={firstHighlightedId} />
      ) : null}
    </div>
  );
}

function TeamGrid({
  teams,
  myTeamId,
  shared,
  others,
  notes,
  now,
  tz,
  tone,
  highlightedTeamIds,
  highlightMatchId,
}: {
  teams: { id: number; number: string }[];
  myTeamId: number;
  shared: (id: number) => MatchObj[];
  others: (id: number) => MatchObj[];
  notes: Map<number, MatchNote>;
  now: Date;
  tz: string | null;
  tone: "partner" | "opponent";
  highlightedTeamIds: Set<number>;
  highlightMatchId: number | null;
}) {
  const sorted = [...teams].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true }),
  );
  const dimOthers = highlightedTeamIds.size > 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sorted.map((t) => {
        const sharedMatches = shared(t.id);
        const otherMatches = others(t.id);
        const highlighted = highlightedTeamIds.has(t.id);
        return (
          <div
            key={t.id}
            id={`team-${t.id}`}
            className={`border p-4 flex flex-col gap-4 scroll-mt-32 transition-opacity ${
              highlighted
                ? "border-accent ring-2 ring-accent bg-subtle"
                : "border-line"
            } ${dimOthers && !highlighted ? "opacity-40" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-base font-semibold">
                {t.number}
              </span>
              <span
                className={`text-[10px] uppercase tracking-widest ${
                  tone === "partner" ? "text-blue" : "text-red"
                }`}
              >
                {sharedMatches.length} shared
              </span>
            </div>

            {sharedMatches.length > 0 ? (
              <MatchGroup
                label="With you"
                matches={sharedMatches}
                myTeamId={myTeamId}
                notes={notes}
                now={now}
                tz={tz}
                highlightMatchId={highlightMatchId}
                includeSideBadge
              />
            ) : null}

            <MatchGroup
              label="Their recent & upcoming"
              matches={otherMatches}
              myTeamId={myTeamId}
              notes={notes}
              now={now}
              tz={tz}
              highlightMatchId={highlightMatchId}
              emptyLabel="No other matches at this event."
            />
          </div>
        );
      })}
    </div>
  );
}

function MatchResult({
  match,
  mySide,
}: {
  match: MatchObj;
  mySide: "red" | "blue" | null;
}) {
  const red = match.alliances.find((a) => a.color === "red");
  const blue = match.alliances.find((a) => a.color === "blue");
  const mine = mySide ? match.alliances.find((a) => a.color === mySide) : null;
  const opp = mySide ? match.alliances.find((a) => a.color !== mySide) : null;
  const outcome =
    mine && opp
      ? mine.score > opp.score
        ? "W"
        : mine.score < opp.score
          ? "L"
          : "T"
      : null;
  const outcomeCls =
    outcome === "W"
      ? "border-blue text-blue bg-blue-soft"
      : outcome === "L"
        ? "border-red text-red bg-red-soft"
        : outcome === "T"
          ? "border-fg"
          : "";
  return (
    <span className="flex items-center gap-2 font-mono">
      <span className="text-red font-semibold">{red?.score ?? "—"}</span>
      <span className="text-muted">–</span>
      <span className="text-blue font-semibold">{blue?.score ?? "—"}</span>
      {outcome ? (
        <span
          className={`inline-block w-5 text-center border text-[10px] font-semibold ${outcomeCls}`}
        >
          {outcome}
        </span>
      ) : null}
    </span>
  );
}

function MatchGroup({
  label,
  matches,
  myTeamId,
  notes,
  now,
  tz,
  emptyLabel,
  includeSideBadge,
  highlightMatchId,
}: {
  label: string;
  matches: MatchObj[];
  myTeamId: number;
  notes: Map<number, MatchNote>;
  now: Date;
  tz: string | null;
  emptyLabel?: string;
  includeSideBadge?: boolean;
  highlightMatchId?: number | null;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
        {label}
      </p>
      {matches.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line border-t border-line">
          {matches.map((m) => {
            const note = notes.get(m.id);
            const side = includeSideBadge ? findTeamSide(m, myTeamId) : null;
            const past = isPast(m, now);
            const isHighlight = highlightMatchId === m.id;
            return (
              <li
                key={m.id}
                className={`py-2 px-2 -mx-2 flex flex-col gap-2 ${
                  isHighlight ? "bg-bg ring-2 ring-accent" : ""
                } ${past && !m.scored ? "opacity-60" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-2 min-w-0">
                    <Link
                      href={scheduleHref(m.id)}
                      title="Show in full schedule"
                      className="font-mono text-xs underline-offset-4 hover:underline hover:text-fg"
                    >
                      {shortMatchName(m)}
                    </Link>
                    {side ? <SideBadge side={side} /> : null}
                    {note?.notes ? (
                      <span
                        title="Has notes"
                        className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
                      />
                    ) : null}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap flex items-center gap-2">
                    {m.scored ? (
                      <MatchResult match={m} mySide={side} />
                    ) : (
                      <>
                        {fmtTime(m.scheduled, tz ?? undefined)} ·{" "}
                        {relativeTime(m.scheduled, now)}
                      </>
                    )}
                  </span>
                </div>
                <MatchNotes
                  matchId={m.id}
                  initialDone={note?.done ?? false}
                  initialNotes={note?.notes ?? ""}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
