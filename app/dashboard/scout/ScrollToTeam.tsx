"use client";

import { useEffect } from "react";

export default function ScrollToTeam({ teamId }: { teamId: number }) {
  useEffect(() => {
    const el = document.getElementById(`team-${teamId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [teamId]);
  return null;
}
