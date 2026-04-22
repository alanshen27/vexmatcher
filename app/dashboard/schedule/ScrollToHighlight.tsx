"use client";

import { useEffect } from "react";

export default function ScrollToHighlight({ matchId }: { matchId: number }) {
  useEffect(() => {
    const el = document.getElementById(`match-${matchId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [matchId]);
  return null;
}
