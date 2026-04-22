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

function scheduleHref(matchId: number) {
  return `/dashboard/schedule?highlight=${matchId}`;
}

export default async function ScoutPage() {
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

  const { team, matches: allMatches, now } = ctx;
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

  const otherUpcomingByTeam = new Map<number, MatchObj[]>();
  const relevantTeams = new Set<number>([
    ...partnerIds.keys(),
    ...opponentIds.keys(),
  ]);
  for (const otherId of relevantTeams) {
    otherUpcomingByTeam.set(
      otherId,
      upcomingMatches(
        allMatches.filter(
          (m) => findTeamSide(m, otherId) !== null && !myMatches.includes(m),
        ),
        now,
      ).slice(0, 4),
    );
  }

  const matchIds = new Set<number>();
  for (const m of myUpcoming) matchIds.add(m.id);
  for (const ms of otherUpcomingByTeam.values()) {
    for (const m of ms) matchIds.add(m.id);
  }
  const notes = await getNotesForTeam([...matchIds]);

  const sharedMatchesWith = (otherId: number) =>
    myUpcoming.filter(
      (m) =>
        (partnerByMatch.get(m.id) ?? []).some((t) => t.id === otherId) ||
        (opponentByMatch.get(m.id) ?? []).some((t) => t.id === otherId),
    );

  return (
    <div className="grid grid-cols-1 gap-12">
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
            shared={sharedMatchesWith}
            others={(id) => otherUpcomingByTeam.get(id) ?? []}
            notes={notes}
            now={now}
            tone="partner"
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
            shared={sharedMatchesWith}
            others={(id) => otherUpcomingByTeam.get(id) ?? []}
            notes={notes}
            now={now}
            tone="opponent"
          />
        )}
      </Section>
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
  tone,
}: {
  teams: { id: number; number: string }[];
  myTeamId: number;
  shared: (id: number) => MatchObj[];
  others: (id: number) => MatchObj[];
  notes: Map<number, MatchNote>;
  now: Date;
  tone: "partner" | "opponent";
}) {
  const sorted = [...teams].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true }),
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sorted.map((t) => {
        const sharedMatches = shared(t.id);
        const otherMatches = others(t.id);
        return (
          <div key={t.id} className="border border-line p-4 flex flex-col gap-4">
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
                includeSideBadge
              />
            ) : null}

            <MatchGroup
              label="Their other upcoming"
              matches={otherMatches}
              myTeamId={myTeamId}
              notes={notes}
              now={now}
              emptyLabel="No other upcoming matches."
            />
          </div>
        );
      })}
    </div>
  );
}

function MatchGroup({
  label,
  matches,
  myTeamId,
  notes,
  now,
  emptyLabel,
  includeSideBadge,
}: {
  label: string;
  matches: MatchObj[];
  myTeamId: number;
  notes: Map<number, MatchNote>;
  now: Date;
  emptyLabel?: string;
  includeSideBadge?: boolean;
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
            return (
              <li key={m.id} className="py-2 flex flex-col gap-2">
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
                  <span className="text-xs text-muted whitespace-nowrap">
                    {fmtTime(m.scheduled)} · {relativeTime(m.scheduled, now)}
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
