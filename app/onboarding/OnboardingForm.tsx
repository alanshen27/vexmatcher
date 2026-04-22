"use client";

import { useActionState } from "react";
import { searchTeamsAction, chooseTeamAction, type SearchState } from "./actions";

const PROGRAMS: { id: string; label: string }[] = [
  { id: "", label: "Any program" },
  { id: "1", label: "VRC (V5RC)" },
  { id: "4", label: "VEX U (VURC)" },
  { id: "41", label: "VIQRC" },
  { id: "47", label: "VEX AI (VAIRC)" },
  { id: "44", label: "VEX U Workshop" },
  { id: "37", label: "ADC" },
  { id: "57", label: "VEX GO" },
];

const initial: SearchState = { ok: false };

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    searchTeamsAction,
    initial,
  );

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <input
            name="number"
            defaultValue={state.number}
            placeholder="Team number (e.g. 1234A)"
            autoComplete="off"
            autoFocus
            className="h-12 px-4 border border-line bg-bg text-fg placeholder:text-muted focus:outline-none focus:border-fg transition-colors uppercase tracking-wide"
          />
          <select
            name="programId"
            defaultValue={state.programId ?? ""}
            className="h-12 px-3 border border-line bg-bg text-fg focus:outline-none focus:border-fg transition-colors"
          >
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-12 bg-accent text-on-accent font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Searching…" : "Search"}
        </button>
        {state.error ? (
          <p className="text-sm text-muted border-l-2 border-fg pl-3">
            {state.error}
          </p>
        ) : null}
      </form>

      {state.ok && state.results ? (
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            {state.results.length} match{state.results.length === 1 ? "" : "es"}
          </p>
          <ul className="flex flex-col border border-line divide-y divide-line">
            {state.results.map((t) => (
              <li key={t.id}>
                <form action={chooseTeamAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="number" value={t.number} />
                  <input type="hidden" name="name" value={t.name} />
                  <input type="hidden" name="programId" value={t.programId} />
                  <input
                    type="hidden"
                    name="programName"
                    value={t.programName}
                  />
                  <button
                    type="submit"
                    className="w-full text-left p-4 hover:bg-subtle transition-colors flex flex-col gap-1"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-base font-semibold">
                        {t.number}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-muted">
                        {t.programName}
                      </span>
                    </div>
                    <span className="text-sm">{t.name || "—"}</span>
                    {t.organization || t.location ? (
                      <span className="text-xs text-muted">
                        {[t.organization, t.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
