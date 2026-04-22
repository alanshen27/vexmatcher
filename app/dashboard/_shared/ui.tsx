import Link from "next/link";

export function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        {eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function TeamList({
  label,
  teams,
  side,
}: {
  label: string;
  teams: { id: number; number: string }[];
  side?: "red" | "blue" | null;
}) {
  const tint =
    side === "red"
      ? "border-red bg-red-soft"
      : side === "blue"
        ? "border-blue bg-blue-soft"
        : "border-line";
  const labelTint =
    side === "red"
      ? "text-red"
      : side === "blue"
        ? "text-blue"
        : "text-muted";
  return (
    <div className={`flex flex-col gap-1 p-3 border ${tint}`}>
      <p className={`text-[10px] uppercase tracking-widest ${labelTint}`}>
        {label}
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {teams.length === 0 ? (
          <li className="text-sm text-muted">—</li>
        ) : (
          teams.map((t) => (
            <li key={t.id} className="font-mono text-sm">
              {t.number}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function SideBadge({ side }: { side: "red" | "blue" | null }) {
  if (!side) return null;
  const cls =
    side === "red"
      ? "border-red text-red bg-red-soft"
      : "border-blue text-blue bg-blue-soft";
  return (
    <span
      className={`text-[10px] uppercase tracking-widest border px-1.5 py-0.5 font-semibold ${cls}`}
    >
      {side}
    </span>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted border-l-2 border-line pl-3 py-1">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="border border-line p-10 text-center flex flex-col gap-3 items-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="text-sm underline underline-offset-4"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-fg p-6 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Couldn&apos;t load schedule</h2>
      <pre className="text-xs whitespace-pre-wrap font-mono text-muted">
        {message}
      </pre>
      <Link href="/onboarding" className="underline underline-offset-4 text-sm">
        Pick a different team
      </Link>
    </div>
  );
}
