"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveNotesAction, toggleDoneAction } from "./notes-actions";

type Props = {
  matchId: number;
  initialDone: boolean;
  initialNotes: string;
};

export default function MatchNotes({
  matchId,
  initialDone,
  initialNotes,
}: Props) {
  const [done, setDone] = useState(initialDone);
  const [notes, setNotes] = useState(initialNotes);
  const [open, setOpen] = useState(initialNotes.trim().length > 0);
  const [savedValue, setSavedValue] = useState(initialNotes);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notes === savedValue) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const fd = new FormData();
      fd.set("matchId", String(matchId));
      fd.set("notes", notes);
      const snapshot = notes;
      startTransition(async () => {
        await saveNotesAction(fd);
        setSavedValue(snapshot);
        setSavedAt(Date.now());
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [notes, savedValue, matchId]);

  const toggle = () => {
    const next = !done;
    setDone(next);
    const fd = new FormData();
    fd.set("matchId", String(matchId));
    fd.set("done", String(next));
    startTransition(() => toggleDoneAction(fd));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <span
            role="checkbox"
            aria-checked={done}
            tabIndex={0}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                toggle();
              }
            }}
            className={`inline-flex h-5 w-5 items-center justify-center border ${
              done
                ? "bg-accent text-on-accent border-accent"
                : "border-fg group-hover:bg-subtle"
            } transition-colors`}
          >
            {done ? (
              <svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
            ) : null}
          </span>
          <span
            onClick={toggle}
            className={`text-xs uppercase tracking-widest ${
              done ? "line-through text-muted" : ""
            }`}
          >
            Done
          </span>
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs uppercase tracking-widest text-muted hover:text-fg transition-colors"
        >
          {open ? "Hide notes" : notes ? "Notes" : "Add notes"}
        </button>
      </div>
      {open ? (
        <div className="flex flex-col gap-1">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Strategy, scouting, reminders…"
            rows={3}
            className="w-full resize-y p-3 border border-line bg-bg text-fg placeholder:text-muted focus:outline-none focus:border-fg transition-colors text-sm font-mono"
          />
          <div className="flex justify-end">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              {notes === savedValue
                ? savedAt
                  ? "Saved"
                  : " "
                : "Saving…"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
