import { redirect } from "next/navigation";
import { readTeamCookie, readTimezoneCookie } from "../lib/cookies";
import { resetTeamAction } from "../onboarding/actions";
import NavTabs from "./_shared/NavTabs";
import TimezonePicker from "./_shared/TimezonePicker";
import { getDashboardContext } from "./_shared/context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const team = await readTeamCookie();
  if (!team) redirect("/onboarding");

  const tz = await readTimezoneCookie();
  const ctx = await getDashboardContext();
  const eventName = ctx.ok ? ctx.event.name : undefined;
  const eventLocation = ctx.ok
    ? [ctx.event.location?.city, ctx.event.location?.region]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return (
    <main className="flex-1 w-full">
      <div className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
              Vex Matcher
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="font-mono">{team.number}</span>
              {team.name ? (
                <span className="text-muted font-normal"> · {team.name}</span>
              ) : null}
            </h1>
            {eventName ? (
              <p className="text-sm text-muted mt-1">
                {eventName}
                {eventLocation ? ` · ${eventLocation}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <TimezonePicker current={tz} />
            <form action={resetTeamAction}>
              <button
                type="submit"
                className="text-xs uppercase tracking-widest border border-line px-3 py-2 hover:bg-subtle transition-colors"
              >
                Switch team
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <NavTabs />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
    </main>
  );
}
