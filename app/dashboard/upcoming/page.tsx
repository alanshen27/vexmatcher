import Link from "next/link";
import {
  findTeamSide,
  matchesForTeam,
  partnersAndOpponents,
  upcomingMatches,
} from "../../lib/schedule";
import { fmtTime, relativeTime, shortMatchName } from "../../lib/format";
import MatchNotes from "../MatchNotes";
import { getNotesForTeam } from "../notes-actions";
import { getDashboardContext } from "../_shared/context";
import {
  EmptyState,
  ErrorBox,
  Section,
  SideBadge,
  TeamList,
} from "../_shared/ui";

export default async function UpcomingPage() {
  const ctx = await getDashboardContext();
  if (!ctx.ok) {
    if (ctx.reason === "no-event") {
      return (
        <EmptyState
          title="No upcoming events"
          body={`${ctx.team?.number ?? "This team"} doesn't have any registered events in the next 60 days.`}
          action={{ href: "/onboarding", label: "Switch team" }}
        />
      );
    }
    return <ErrorBox message={ctx.error ?? "Unknown error"} />;
  }

  const { team, matches: allMatches, now, tz } = ctx;
  const myMatches = matchesForTeam(allMatches, team.id);
  const myUpcoming = upcomingMatches(myMatches, now).slice(0, 8);
  const myRecent = myMatches
    .filter((m) => m.scored || (m.scheduled && new Date(m.scheduled) < now))
    .slice(-3)
    .reverse();

  const notes = await getNotesForTeam([
    ...myUpcoming.map((m) => m.id),
    ...myRecent.map((m) => m.id),
  ]);

  return (
    <div className="grid grid-cols-1 gap-12">
      <Section
        eyebrow="Up next"
        title={`${team.number} · upcoming matches`}
        subtitle={
          myUpcoming.length === 0
            ? "Nothing scheduled — check back later or refresh."
            : `${myUpcoming.length} match${myUpcoming.length === 1 ? "" : "es"} ahead`
        }
      >
        {myUpcoming.length === 0 ? null : (
          <ul className="flex flex-col border border-line divide-y divide-line">
            {myUpcoming.map((m) => {
              const { partners, opponents } = partnersAndOpponents(m, team.id);
              const side = findTeamSide(m, team.id);
              return (
                <li key={m.id} className="p-5 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="flex items-baseline gap-3">
                      <Link
                        href={`/dashboard/schedule?highlight=${m.id}`}
                        title="Show in full schedule"
                        className="font-mono text-sm uppercase tracking-widest text-muted underline-offset-4 hover:underline hover:text-fg"
                      >
                        {shortMatchName(m)}
                      </Link>
                      {m.field ? (
                        <span className="font-mono text-xs text-muted">
                          · {m.field}
                        </span>
                      ) : null}
                      <SideBadge side={side} />
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {fmtTime(m.scheduled, tz ?? undefined)}
                      </div>
                      <div className="text-xs text-muted">
                        {relativeTime(m.scheduled, now)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TeamList label="Alliance" teams={partners} side={side} />
                    <TeamList
                      label="Opponents"
                      teams={opponents}
                      side={side === "red" ? "blue" : side === "blue" ? "red" : null}
                    />
                  </div>
                  <div className="border-t border-line pt-3">
                    <MatchNotes
                      matchId={m.id}
                      initialDone={notes.get(m.id)?.done ?? false}
                      initialNotes={notes.get(m.id)?.notes ?? ""}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {myRecent.length > 0 ? (
        <Section
          eyebrow="Just played"
          title="Recent matches"
          subtitle="Your last few results."
        >
          <ul className="flex flex-col border border-line divide-y divide-line">
            {myRecent.map((m) => {
              const side = findTeamSide(m, team.id);
              const myAlliance = m.alliances.find((a) => a.color === side);
              const oppAlliance = m.alliances.find((a) => a.color !== side);
              const oppSide = side === "red" ? "blue" : side === "blue" ? "red" : null;
              const won =
                m.scored && myAlliance && oppAlliance
                  ? myAlliance.score > oppAlliance.score
                    ? "W"
                    : myAlliance.score < oppAlliance.score
                      ? "L"
                      : "T"
                  : "";
              const resultCls =
                won === "W"
                  ? "border-blue text-blue bg-blue-soft"
                  : won === "L"
                    ? "border-red text-red bg-red-soft"
                    : won === "T"
                      ? "border-fg"
                      : "border-transparent";
              return (
                <li key={m.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-sm text-muted">
                        {shortMatchName(m)}
                      </span>
                      <SideBadge side={side} />
                    </div>
                    <div className="font-mono text-sm flex items-center gap-2">
                      <span
                        className={
                          side === "red"
                            ? "text-red font-semibold"
                            : side === "blue"
                              ? "text-blue font-semibold"
                              : ""
                        }
                      >
                        {myAlliance?.score ?? "—"}
                      </span>
                      <span className="text-muted">·</span>
                      <span
                        className={
                          oppSide === "red"
                            ? "text-red"
                            : oppSide === "blue"
                              ? "text-blue"
                              : "text-muted"
                        }
                      >
                        {oppAlliance?.score ?? "—"}
                      </span>
                      {won ? (
                        <span
                          className={`ml-2 inline-block w-5 text-center border text-xs font-semibold ${resultCls}`}
                        >
                          {won}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <MatchNotes
                    matchId={m.id}
                    initialDone={notes.get(m.id)?.done ?? false}
                    initialNotes={notes.get(m.id)?.notes ?? ""}
                  />
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
