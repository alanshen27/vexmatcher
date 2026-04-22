"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { COMMON_TIMEZONES } from "../../lib/tz";
import { setTimezoneAction } from "./tz-actions";

type Props = {
  current: string | null;
};

export default function TimezonePicker({ current }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const bootstrapped = useRef(false);
  const detected =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  // Auto-detect browser timezone on first load if the user hasn't chosen one.
  useEffect(() => {
    if (current || bootstrapped.current) return;
    bootstrapped.current = true;
    const fd = new FormData();
    fd.set("tz", detected);
    startTransition(() => setTimezoneAction(fd));
  }, [current, detected]);

  const options = Array.from(new Set([detected, ...COMMON_TIMEZONES])).filter(
    Boolean,
  );

  const label = current ?? detected;

  const submit = (value: string) => {
    const fd = new FormData();
    fd.set("tz", value);
    startTransition(() => {
      setTimezoneAction(fd);
      setOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="text-xs uppercase tracking-widest border border-line px-3 py-2 hover:bg-subtle transition-colors flex items-center gap-2"
        title={`Times shown in ${label}`}
      >
        <span className="text-muted">TZ</span>
        <span className="font-mono normal-case tracking-normal">
          {shortTz(label)}
        </span>
        {pending ? <span className="text-muted">…</span> : null}
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-[14rem] max-h-80 overflow-auto border border-line bg-bg shadow-sm"
        >
          <button
            type="button"
            onClick={() => submit(detected)}
            className="w-full text-left px-3 py-2 text-xs hover:bg-subtle flex items-center justify-between gap-3"
          >
            <span className="uppercase tracking-widest text-muted">
              Auto-detect
            </span>
            <span className="font-mono">{shortTz(detected)}</span>
          </button>
          <div className="border-t border-line" />
          {options.map((tz) => {
            const selected = tz === label;
            return (
              <button
                key={tz}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => submit(tz)}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between gap-3 ${
                  selected ? "bg-accent text-on-accent" : "hover:bg-subtle"
                }`}
              >
                <span>{tz}</span>
                <span
                  className={selected ? "text-on-accent/70" : "text-muted"}
                >
                  {tzOffset(tz)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function shortTz(tz: string): string {
  const city = tz.includes("/") ? tz.slice(tz.lastIndexOf("/") + 1) : tz;
  return city.replace(/_/g, " ");
}

function tzOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}
