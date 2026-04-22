import OnboardingForm from "./OnboardingForm";
import { readTeamCookie } from "../lib/cookies";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const existing = await readTeamCookie();

  return (
    <main className="flex-1 w-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">
            Vex Matcher
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Pick your team.
          </h1>
          <p className="text-muted">
            We&apos;ll remember your choice on this device and use it to surface
            your next match, your alliance partners, and your opponents.
          </p>
          {existing ? (
            <p className="mt-2 text-sm">
              Currently set to{" "}
              <span className="font-mono font-semibold">{existing.number}</span>
              {existing.name ? ` · ${existing.name}` : ""}.{" "}
              <Link className="underline underline-offset-4" href="/dashboard">
                Go to dashboard
              </Link>
            </p>
          ) : null}
        </header>

        <OnboardingForm />

        <footer className="text-xs text-muted border-t border-line pt-4">
          Data via the public RobotEvents API. Set{" "}
          <code className="font-mono">ROBOTEVENTS_TOKEN</code> in
          <code className="font-mono"> .env.local</code> to enable lookups.
        </footer>
      </div>
    </main>
  );
}
