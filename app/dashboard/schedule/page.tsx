import Link from "next/link";
import { findTeamSide } from "../../lib/schedule";
import { fmtDay, fmtTime, shortMatchName } from "../../lib/format";
import type { MatchObj } from "../../lib/robotevents";
import { getDashboardContext } from "../_shared/context";
import { EmptyState, ErrorBox, Section } from "../_shared/ui";
import ScrollToHighlight from "./ScrollToHighlight";

const PAGE_SIZE = 25;

type PageProps = {
  searchParams: Promise<{
    page?: string | string[];
    mine?: string | string[];
    highlight?: string | string[];
  }>;
};

export default async function SchedulePage({ searchParams }: PageProps) {
  const ctx = await getDashboardContext();
  if (!ctx.ok) {
    if (ctx.reason === "no-event") {
      return (
        <EmptyState
          title="No event schedule"
          body="You don't have any upcoming events yet."
          action={{ href: "/onboarding", label: "Switch team" }}
        />
      );
    }
    return <ErrorBox message={ctx.error ?? "Unknown error"} />;
  }

  const sp = await searchParams;
  const mineOnly = firstStr(sp.mine) === "1";
  const pageParam = firstStr(sp.page);
  const highlights = parseHighlights(sp.highlight);
  const { team, event, matches: allMatches, now } = ctx;

  const filtered = mineOnly
    ? allMatches.filter((m) => findTeamSide(m, team.id) !== null)
    : allMatches;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  let page: number;
  if (pageParam) {
    page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  } else if (highlights.size > 0) {
    // Jump to the page of the first highlighted match (in schedule order).
    const idx = filtered.findIndex((m) => highlights.has(m.id));
    page = idx >= 0 ? Math.floor(idx / PAGE_SIZE) + 1 : 1;
  } else {
    page = 1;
  }

  const startIndex = (page - 1) * PAGE_SIZE;
  const pageMatches = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const nextIndex = filtered.findIndex(
    (m) =>
      !m.scored &&
      (!m.scheduled ||
        new Date(m.scheduled).getTime() >= now.getTime() - 5 * 60 * 1000),
  );
  const nextPage = nextIndex >= 0 ? Math.floor(nextIndex / PAGE_SIZE) + 1 : null;

  // Whichever highlighted match lands on the current page, auto-scroll to it.
  const firstHighlightOnPage = pageMatches.find((m) => highlights.has(m.id));

  return (
    <Section
      eyebrow="Whole event"
      title="Full schedule"
      subtitle={`${filtered.length} match${filtered.length === 1 ? "" : "es"} across ${
        event.divisions?.length ?? 1
      } division${(event.divisions?.length ?? 1) === 1 ? "" : "s"}${
        mineOnly ? ` · filtered to ${team.number}` : ""
      }.`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterToggle mineOnly={mineOnly} teamNumber={team.number} />
        <div className="flex items-center gap-2">
          {highlights.size > 0 ? (
            <Link
              href={schedulePath({ page: 1, mineOnly })}
              className="text-xs uppercase tracking-widest border border-line px-3 py-2 hover:bg-subtle transition-colors"
            >
              Clear highlight
            </Link>
          ) : null}
          {nextPage && nextPage !== page ? (
            <Link
              href={schedulePath({ page: nextPage, mineOnly, highlights })}
              className="text-xs uppercase tracking-widest border border-line px-3 py-2 hover:bg-subtle transition-colors"
            >
              Jump to next live match →
            </Link>
          ) : null}
        </div>
      </div>

      <ScheduleList
        matches={pageMatches}
        myTeamId={team.id}
        now={now}
        highlights={highlights}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        mineOnly={mineOnly}
        highlights={highlights}
      />

      {firstHighlightOnPage ? (
        <ScrollToHighlight matchId={firstHighlightOnPage.id} />
      ) : null}
    </Section>
  );
}

function firstStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseHighlights(v: string | string[] | undefined): Set<number> {
  const out = new Set<number>();
  if (!v) return out;
  const arr = Array.isArray(v) ? v : [v];
  for (const raw of arr) {
    for (const token of raw.split(",")) {
      const n = Number(token.trim());
      if (Number.isFinite(n) && n > 0) out.add(n);
    }
  }
  return out;
}

function schedulePath({
  page,
  mineOnly,
  highlights,
}: {
  page: number;
  mineOnly: boolean;
  highlights?: Set<number>;
}) {
  const qs = new URLSearchParams();
  if (page > 1) qs.set("page", String(page));
  if (mineOnly) qs.set("mine", "1");
  if (highlights && highlights.size > 0) {
    qs.set("highlight", [...highlights].join(","));
  }
  const s = qs.toString();
  return `/dashboard/schedule${s ? `?${s}` : ""}`;
}

function FilterToggle({
  mineOnly,
  teamNumber,
}: {
  mineOnly: boolean;
  teamNumber: string;
}) {
  return (
    <div className="flex border border-line">
      <Link
        href={schedulePath({ page: 1, mineOnly: false })}
        className={`px-3 py-2 text-xs uppercase tracking-widest border-r border-line ${
          !mineOnly ? "bg-accent text-on-accent" : "text-muted hover:text-fg"
        }`}
      >
        All matches
      </Link>
      <Link
        href={schedulePath({ page: 1, mineOnly: true })}
        className={`px-3 py-2 text-xs uppercase tracking-widest ${
          mineOnly ? "bg-accent text-on-accent" : "text-muted hover:text-fg"
        }`}
      >
        Only {teamNumber}
      </Link>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  mineOnly,
  highlights,
}: {
  page: number;
  totalPages: number;
  mineOnly: boolean;
  highlights: Set<number>;
}) {
  if (totalPages <= 1) return null;
  const prev =
    page > 1
      ? schedulePath({ page: page - 1, mineOnly, highlights })
      : null;
  const next =
    page < totalPages
      ? schedulePath({ page: page + 1, mineOnly, highlights })
      : null;

  return (
    <nav
      aria-label="Schedule pagination"
      className="flex items-center justify-between gap-3 border-t border-line pt-4"
    >
      {prev ? (
        <Link
          href={prev}
          className="text-xs uppercase tracking-widest border border-line px-3 py-2 hover:bg-subtle transition-colors"
        >
          ← Previous
        </Link>
      ) : (
        <span className="text-xs uppercase tracking-widest border border-line px-3 py-2 opacity-30">
          ← Previous
        </span>
      )}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
        <span>
          Page <span className="font-mono text-fg">{page}</span> of{" "}
          <span className="font-mono text-fg">{totalPages}</span>
        </span>
      </div>
      {next ? (
        <Link
          href={next}
          className="text-xs uppercase tracking-widest border border-line px-3 py-2 hover:bg-subtle transition-colors"
        >
          Next →
        </Link>
      ) : (
        <span className="text-xs uppercase tracking-widest border border-line px-3 py-2 opacity-30">
          Next →
        </span>
      )}
    </nav>
  );
}

function ScheduleList({
  matches,
  myTeamId,
  now,
  highlights,
}: {
  matches: MatchObj[];
  myTeamId: number;
  now: Date;
  highlights: Set<number>;
}) {
  if (matches.length === 0) {
    return (
      <div className="border border-line p-8 text-center text-sm text-muted">
        No matches on this page.
      </div>
    );
  }

  const dayOf = (m: MatchObj) =>
    m.scheduled ? fmtDay(m.scheduled) : "Unscheduled";

  return (
    <ul className="border border-line divide-y divide-line">
      {matches.map((m, i) => {
        const day = dayOf(m);
        const showDayHeader = i === 0 || dayOf(matches[i - 1]) !== day;
        const mine = findTeamSide(m, myTeamId) !== null;
        const past =
          m.scored ||
          (m.scheduled &&
            new Date(m.scheduled).getTime() < now.getTime() - 5 * 60 * 1000);
        const highlighted = highlights.has(m.id);
        return (
          <li key={m.id}>
            {showDayHeader ? (
              <div className="px-3 py-2 bg-subtle border-b border-line text-[10px] uppercase tracking-[0.25em] text-muted">
                {day}
              </div>
            ) : null}
            <div
              id={`match-${m.id}`}
              className={`p-3 grid grid-cols-[4.5rem_1fr_auto] gap-3 items-center scroll-mt-32 ${
                highlighted
                  ? "ring-2 ring-accent ring-offset-0 bg-subtle"
                  : mine
                    ? "bg-subtle/60"
                    : ""
              } ${past && !highlighted ? "opacity-60" : ""}`}
            >
              <span className="font-mono text-xs">{fmtTime(m.scheduled)}</span>
              <span className="text-sm min-w-0">
                <span className="font-mono">{shortMatchName(m)}</span>
                {m.field ? (
                  <span className="text-muted text-xs"> · {m.field}</span>
                ) : null}
                {highlighted ? (
                  <span className="ml-2 text-[10px] uppercase tracking-widest bg-accent text-on-accent px-1.5 py-0.5">
                    Highlighted
                  </span>
                ) : null}
                <span className="flex flex-wrap items-center gap-x-2 text-xs font-mono mt-0.5 min-w-0">
                  {m.alliances.map((a, i) => {
                    const colorCls =
                      a.color === "red" ? "text-red" : "text-blue";
                    return (
                      <span
                        key={a.color}
                        className="flex items-center gap-1 min-w-0"
                      >
                        {i > 0 ? (
                          <span className="text-muted">vs</span>
                        ) : null}
                        <span className={colorCls}>
                          {a.teams.map((t, ti) => (
                            <span key={t.team?.id ?? ti}>
                              {ti > 0 ? (
                                <span className="text-muted"> · </span>
                              ) : null}
                              <span
                                className={
                                  t.team?.id === myTeamId ? "font-bold" : ""
                                }
                              >
                                {t.team?.id === myTeamId
                                  ? `[${t.team?.name ?? ""}]`
                                  : (t.team?.name ?? "")}
                              </span>
                            </span>
                          ))}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </span>
              <span className="text-xs text-right font-mono flex items-center gap-2">
                {m.scored
                  ? m.alliances.map((a, i) => (
                      <span key={a.color} className="flex items-center gap-2">
                        {i > 0 ? <span className="text-muted">–</span> : null}
                        <span
                          className={
                            a.color === "red"
                              ? "text-red font-semibold"
                              : "text-blue font-semibold"
                          }
                        >
                          {a.score}
                        </span>
                      </span>
                    ))
                  : null}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
